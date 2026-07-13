using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerloskundigeSpiekt.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260712210000_HardenTenantPolicies")]
public sealed class HardenTenantPolicies : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP POLICY IF EXISTS practice_members_self_access ON practice_members;
            DROP POLICY IF EXISTS practice_invitation_access ON practice_invitations;

            CREATE OR REPLACE FUNCTION app_is_practice_owner(target_practice_id uuid) RETURNS boolean
            LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
              SELECT EXISTS (
                SELECT 1 FROM practice_members pm JOIN users u ON u.id = pm.user_id
                WHERE pm.practice_id = target_practice_id AND pm.role = 'Owner'
                  AND u.external_subject = app_current_external_subject()
              )
            $$;
            CREATE OR REPLACE FUNCTION app_create_practice(new_practice_id uuid, new_name text, new_slug text, owner_user_id uuid) RETURNS void
            LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
            DECLARE now_utc timestamptz := now(); version_bytes bytea := uuid_send(gen_random_uuid());
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM users u WHERE u.id = owner_user_id AND u.external_subject = app_current_external_subject()) THEN
                RAISE EXCEPTION 'authenticated user mismatch' USING ERRCODE = '42501';
              END IF;
              INSERT INTO practices(id, name, slug, created_at, updated_at, row_version)
                VALUES(new_practice_id, new_name, new_slug, now_utc, now_utc, version_bytes);
              INSERT INTO practice_members(practice_id, user_id, role, created_at, updated_at, row_version)
                VALUES(new_practice_id, owner_user_id, 'Owner', now_utc, now_utc, uuid_send(gen_random_uuid()));
            END $$;

            CREATE OR REPLACE FUNCTION app_respond_to_invitation(target_invitation_id uuid, responding_user_id uuid, desired_status text) RETURNS void
            LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
            DECLARE invitation practice_invitations%ROWTYPE; normalized_current_email text := upper(current_setting('app.user_email', true));
            BEGIN
              IF desired_status NOT IN ('Accepted', 'Declined') THEN RAISE EXCEPTION 'invalid invitation response' USING ERRCODE = '22023'; END IF;
              IF NOT EXISTS (SELECT 1 FROM users u WHERE u.id = responding_user_id AND u.external_subject = app_current_external_subject() AND u.email_verified AND u.normalized_email = normalized_current_email) THEN
                RAISE EXCEPTION 'verified identity mismatch' USING ERRCODE = '42501';
              END IF;
              SELECT * INTO invitation FROM practice_invitations WHERE id = target_invitation_id FOR UPDATE;
              IF NOT FOUND OR invitation.invited_email_normalized <> normalized_current_email THEN RAISE EXCEPTION 'invitation not found' USING ERRCODE = '42501'; END IF;
              IF invitation.status = desired_status THEN RETURN; END IF;
              IF invitation.status <> 'Pending' OR invitation.expires_at <= now() THEN RAISE EXCEPTION 'invitation is not pending' USING ERRCODE = '23514'; END IF;
              IF invitation.role = 'Owner' THEN RAISE EXCEPTION 'owner invitations are forbidden' USING ERRCODE = '23514'; END IF;
              UPDATE practice_invitations SET status = desired_status, responded_at = now(), accepted_by_user_id = CASE WHEN desired_status = 'Accepted' THEN responding_user_id ELSE NULL END, updated_at = now(), row_version = uuid_send(gen_random_uuid()) WHERE id = target_invitation_id;
              IF desired_status = 'Accepted' THEN
                INSERT INTO practice_members(practice_id, user_id, role, created_at, updated_at, row_version)
                  VALUES(invitation.practice_id, responding_user_id, invitation.role, now(), now(), uuid_send(gen_random_uuid()))
                  ON CONFLICT(practice_id, user_id) DO NOTHING;
              END IF;
            END $$;

            CREATE OR REPLACE FUNCTION app_transfer_practice_ownership(target_practice_id uuid, current_owner_user_id uuid, new_owner_user_id uuid) RETURNS void
            LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
            BEGIN
              IF current_owner_user_id = new_owner_user_id OR NOT EXISTS (
                SELECT 1 FROM practice_members member JOIN users current_user_record ON current_user_record.id=member.user_id
                WHERE member.practice_id=target_practice_id AND member.user_id=current_owner_user_id AND member.role='Owner'
                  AND current_user_record.external_subject=app_current_external_subject()) THEN
                RAISE EXCEPTION 'only the current owner may transfer ownership' USING ERRCODE='42501';
              END IF;
              IF NOT EXISTS (SELECT 1 FROM practice_members WHERE practice_id=target_practice_id AND user_id=new_owner_user_id) THEN
                RAISE EXCEPTION 'new owner must already be a member' USING ERRCODE='23503';
              END IF;
              UPDATE practice_members SET role='Owner',updated_at=now(),row_version=uuid_send(gen_random_uuid()) WHERE practice_id=target_practice_id AND user_id=new_owner_user_id;
              UPDATE practice_members SET role='Administrator',updated_at=now(),row_version=uuid_send(gen_random_uuid()) WHERE practice_id=target_practice_id AND user_id=current_owner_user_id;
            END $$;

            REVOKE ALL ON FUNCTION app_create_practice(uuid, text, text, uuid) FROM PUBLIC;
            REVOKE ALL ON FUNCTION app_respond_to_invitation(uuid, uuid, text) FROM PUBLIC;
            REVOKE ALL ON FUNCTION app_transfer_practice_ownership(uuid, uuid, uuid) FROM PUBLIC;
            GRANT EXECUTE ON FUNCTION app_create_practice(uuid, text, text, uuid) TO vs_api;
            GRANT EXECUTE ON FUNCTION app_respond_to_invitation(uuid, uuid, text) TO vs_api;
            GRANT EXECUTE ON FUNCTION app_transfer_practice_ownership(uuid, uuid, uuid) TO vs_api;
            REVOKE INSERT ON practices, practice_members FROM vs_api;

            CREATE POLICY practice_members_select ON practice_members FOR SELECT
              USING (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()) OR app_is_practice_admin(practice_id));
            CREATE POLICY practice_members_insert ON practice_members FOR INSERT WITH CHECK (
              (app_is_practice_admin(practice_id) AND role <> 'Owner')
              OR (role <> 'Owner'
                  AND user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject())
                  AND EXISTS (SELECT 1 FROM practice_invitations invitation
                    WHERE invitation.practice_id = practice_members.practice_id
                      AND invitation.accepted_by_user_id = practice_members.user_id
                      AND invitation.status = 'Accepted'
                      AND invitation.role = practice_members.role
                      AND invitation.invited_email_normalized = upper(current_setting('app.user_email', true))))
            );
            CREATE POLICY practice_members_update ON practice_members FOR UPDATE
              USING (app_is_practice_admin(practice_id))
              WITH CHECK (app_is_practice_owner(practice_id) OR (app_is_practice_admin(practice_id) AND role <> 'Owner'));
            CREATE POLICY practice_members_delete ON practice_members FOR DELETE USING (app_is_practice_admin(practice_id));

            CREATE POLICY practice_invitations_select ON practice_invitations FOR SELECT
              USING (invited_email_normalized = upper(current_setting('app.user_email', true)) OR app_is_practice_admin(practice_id));
            CREATE POLICY practice_invitations_insert ON practice_invitations FOR INSERT
              WITH CHECK (app_is_practice_admin(practice_id) AND role <> 'Owner');
            CREATE POLICY practice_invitations_admin_update ON practice_invitations FOR UPDATE
              USING (app_is_practice_admin(practice_id)) WITH CHECK (app_is_practice_admin(practice_id) AND role <> 'Owner');
            CREATE POLICY practice_invitations_delete ON practice_invitations FOR DELETE USING (app_is_practice_admin(practice_id));

            ALTER TABLE practice_invitations ADD CONSTRAINT ck_practice_invitations_role_not_owner CHECK (role <> 'Owner');
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE practice_invitations DROP CONSTRAINT IF EXISTS ck_practice_invitations_role_not_owner;
            DROP POLICY IF EXISTS practice_members_select ON practice_members;
            DROP POLICY IF EXISTS practice_members_insert ON practice_members;
            DROP POLICY IF EXISTS practice_members_update ON practice_members;
            DROP POLICY IF EXISTS practice_members_delete ON practice_members;
            DROP POLICY IF EXISTS practice_invitations_select ON practice_invitations;
            DROP POLICY IF EXISTS practice_invitations_insert ON practice_invitations;
            DROP POLICY IF EXISTS practice_invitations_admin_update ON practice_invitations;
            DROP POLICY IF EXISTS practice_invitations_delete ON practice_invitations;
            DROP FUNCTION IF EXISTS app_is_practice_owner(uuid);
            DROP FUNCTION IF EXISTS app_respond_to_invitation(uuid, uuid, text);
            DROP FUNCTION IF EXISTS app_transfer_practice_ownership(uuid, uuid, uuid);
            DROP FUNCTION IF EXISTS app_create_practice(uuid, text, text, uuid);
            CREATE POLICY practice_members_self_access ON practice_members USING (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()) OR app_is_practice_admin(practice_id)) WITH CHECK (user_id = (SELECT id FROM users WHERE external_subject = app_current_external_subject()) OR app_is_practice_admin(practice_id));
            CREATE POLICY practice_invitation_access ON practice_invitations USING (invited_email_normalized = upper(current_setting('app.user_email', true)) OR app_is_practice_admin(practice_id)) WITH CHECK (app_is_practice_admin(practice_id));
            """);
    }
}
