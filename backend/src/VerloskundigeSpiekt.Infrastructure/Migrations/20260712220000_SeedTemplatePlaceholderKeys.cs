using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VerloskundigeSpiekt.Infrastructure.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260712220000_SeedTemplatePlaceholderKeys")]
public sealed class SeedTemplatePlaceholderKeys : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        INSERT INTO email_template_keys(id,key,description,required) VALUES
          ('71000000-0000-0000-0000-000000000001','patient.firstName','First name supplied locally by the extension',false),
          ('71000000-0000-0000-0000-000000000002','patient.lastName','Last name supplied locally by the extension',false),
          ('71000000-0000-0000-0000-000000000003','patient.email','Email supplied locally by the extension',false),
          ('71000000-0000-0000-0000-000000000004','provider.name','Provider name supplied locally by the extension',false),
          ('71000000-0000-0000-0000-000000000005','practice.name','Practice name supplied locally by the extension',false),
          ('71000000-0000-0000-0000-000000000006','appointment.date','Appointment date supplied locally by the extension',false)
        ON CONFLICT(key) DO NOTHING;
        GRANT SELECT ON email_template_keys TO vs_api;
        """);

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("DELETE FROM email_template_keys WHERE id::text LIKE '71000000-0000-0000-0000-00000000000%';");
}
