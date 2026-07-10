export interface paths {
    "/api/v1/practices/{practiceId}/pages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticePageDto"][];
                        "application/json": components["schemas"]["PracticePageDto"][];
                        "text/json": components["schemas"]["PracticePageDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/pages/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticePageDto"];
                        "application/json": components["schemas"]["PracticePageDto"];
                        "text/json": components["schemas"]["PracticePageDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: {
                    "If-Match"?: string;
                };
                path: {
                    practiceId: string;
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["PageRequest"];
                    "text/json": components["schemas"]["PageRequest"];
                    "application/*+json": components["schemas"]["PageRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticePageDto"];
                        "application/json": components["schemas"]["PracticePageDto"];
                        "text/json": components["schemas"]["PracticePageDto"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/templates/published": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["EmailTemplateDto"][];
                        "application/json": components["schemas"]["EmailTemplateDto"][];
                        "text/json": components["schemas"]["EmailTemplateDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/templates/published/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                    key: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["EmailTemplateDto"];
                        "application/json": components["schemas"]["EmailTemplateDto"];
                        "text/json": components["schemas"]["EmailTemplateDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/templates/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: {
                    "If-Match"?: string;
                };
                path: {
                    practiceId: string;
                    key: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["TemplateRequest"];
                    "text/json": components["schemas"]["TemplateRequest"];
                    "application/*+json": components["schemas"]["TemplateRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["EmailTemplateDto"];
                        "application/json": components["schemas"]["EmailTemplateDto"];
                        "text/json": components["schemas"]["EmailTemplateDto"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/contacts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    cursor?: string;
                    pageSize?: number;
                };
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ContactDtoPagedResult"];
                        "application/json": components["schemas"]["ContactDtoPagedResult"];
                        "text/json": components["schemas"]["ContactDtoPagedResult"];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ContactRequest"];
                    "text/json": components["schemas"]["ContactRequest"];
                    "application/*+json": components["schemas"]["ContactRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ContactDto"];
                        "application/json": components["schemas"]["ContactDto"];
                        "text/json": components["schemas"]["ContactDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/contacts/{contactId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: {
                    "If-Match"?: string;
                };
                path: {
                    practiceId: string;
                    contactId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ContactRequest"];
                    "text/json": components["schemas"]["ContactRequest"];
                    "application/*+json": components["schemas"]["ContactRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ContactDto"];
                        "application/json": components["schemas"]["ContactDto"];
                        "text/json": components["schemas"]["ContactDto"];
                    };
                };
            };
        };
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                    contactId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/articles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ArticleDto"][];
                        "application/json": components["schemas"]["ArticleDto"][];
                        "text/json": components["schemas"]["ArticleDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/articles/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ArticleDto"];
                        "application/json": components["schemas"]["ArticleDto"];
                        "text/json": components["schemas"]["ArticleDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    query?: string;
                    practiceId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["SearchResultDto"][];
                        "application/json": components["schemas"]["SearchResultDto"][];
                        "text/json": components["schemas"]["SearchResultDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["FileDto"][];
                        "application/json": components["schemas"]["FileDto"][];
                        "text/json": components["schemas"]["FileDto"][];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FileRequest"];
                    "text/json": components["schemas"]["FileRequest"];
                    "application/*+json": components["schemas"]["FileRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["FileDto"];
                        "application/json": components["schemas"]["FileDto"];
                        "text/json": components["schemas"]["FileDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invitations/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["InvitationDto"][];
                        "application/json": components["schemas"]["InvitationDto"][];
                        "text/json": components["schemas"]["InvitationDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invitations/{invitationId}/response": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    invitationId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["InvitationResponseRequest"];
                    "text/json": components["schemas"]["InvitationResponseRequest"];
                    "application/*+json": components["schemas"]["InvitationResponseRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["InvitationDto"];
                        "application/json": components["schemas"]["InvitationDto"];
                        "text/json": components["schemas"]["InvitationDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["MeDto"];
                        "application/json": components["schemas"]["MeDto"];
                        "text/json": components["schemas"]["MeDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/preferences/active-practice": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": string;
                        "application/json": string;
                        "text/json": string;
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ActivePracticeRequest"];
                    "text/json": components["schemas"]["ActivePracticeRequest"];
                    "application/*+json": components["schemas"]["ActivePracticeRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["MeDto"];
                        "application/json": components["schemas"]["MeDto"];
                        "text/json": components["schemas"]["MeDto"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticeDto"][];
                        "application/json": components["schemas"]["PracticeDto"][];
                        "text/json": components["schemas"]["PracticeDto"][];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: {
                    "Idempotency-Key"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreatePracticeRequest"];
                    "text/json": components["schemas"]["CreatePracticeRequest"];
                    "application/*+json": components["schemas"]["CreatePracticeRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticeDto"];
                        "application/json": components["schemas"]["PracticeDto"];
                        "text/json": components["schemas"]["PracticeDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticeDto"];
                        "application/json": components["schemas"]["PracticeDto"];
                        "text/json": components["schemas"]["PracticeDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: {
                    "If-Match"?: string;
                };
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UpdatePracticeRequest"];
                    "text/json": components["schemas"]["UpdatePracticeRequest"];
                    "application/*+json": components["schemas"]["UpdatePracticeRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PracticeDto"];
                        "application/json": components["schemas"]["PracticeDto"];
                        "text/json": components["schemas"]["PracticeDto"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["MemberDto"][];
                        "application/json": components["schemas"]["MemberDto"][];
                        "text/json": components["schemas"]["MemberDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/members/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                    userId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch: {
            parameters: {
                query?: never;
                header?: {
                    "If-Match"?: string;
                };
                path: {
                    practiceId: string;
                    userId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UpdateMemberRequest"];
                    "text/json": components["schemas"]["UpdateMemberRequest"];
                    "application/*+json": components["schemas"]["UpdateMemberRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/ownership-transfer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["TransferOwnershipRequest"];
                    "text/json": components["schemas"]["TransferOwnershipRequest"];
                    "application/*+json": components["schemas"]["TransferOwnershipRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["InvitationDto"][];
                        "application/json": components["schemas"]["InvitationDto"][];
                        "text/json": components["schemas"]["InvitationDto"][];
                    };
                };
            };
        };
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["CreateInvitationRequest"];
                    "text/json": components["schemas"]["CreateInvitationRequest"];
                    "application/*+json": components["schemas"]["CreateInvitationRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["InvitationDto"];
                        "application/json": components["schemas"]["InvitationDto"];
                        "text/json": components["schemas"]["InvitationDto"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/practices/{practiceId}/invitations/{invitationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    practiceId: string;
                    invitationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ActivePracticeRequest: {
            /** Format: uuid */
            practiceId?: string | null;
        };
        ArticleDto: {
            /** Format: uuid */
            id?: string;
            slug?: string | null;
            title?: string | null;
            /** Format: int32 */
            position?: number;
            documentJson?: string | null;
        };
        ContactDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            practiceId?: string;
            displayName?: string | null;
            email?: string | null;
            telephone?: string | null;
            metadataJson?: string | null;
            version?: string | null;
        };
        ContactDtoPagedResult: {
            items?: components["schemas"]["ContactDto"][] | null;
            nextCursor?: string | null;
        };
        ContactRequest: {
            displayName?: string | null;
            email?: string | null;
            telephone?: string | null;
            metadataJson?: string | null;
        };
        CreateInvitationRequest: {
            email?: string | null;
            role?: components["schemas"]["PracticeRole"];
            /** Format: int32 */
            validForDays?: number;
        };
        CreatePracticeRequest: {
            name?: string | null;
            slug?: string | null;
        };
        EmailTemplateDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            practiceId?: string;
            key?: string | null;
            name?: string | null;
            definitionJson?: string | null;
            status?: components["schemas"]["TemplateVersionStatus"];
            version?: string | null;
        };
        FileDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            practiceId?: string;
            fileName?: string | null;
            contentType?: string | null;
            /** Format: int64 */
            sizeBytes?: number;
            storageObjectName?: string | null;
            /** Format: date-time */
            updatedAt?: string;
        };
        FileRequest: {
            fileName?: string | null;
            contentType?: string | null;
            /** Format: int64 */
            sizeBytes?: number;
            storageObjectName?: string | null;
        };
        InvitationDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            practiceId?: string;
            email?: string | null;
            role?: components["schemas"]["PracticeRole"];
            status?: components["schemas"]["InvitationStatus"];
            /** Format: date-time */
            expiresAt?: string;
            version?: string | null;
        };
        /** @enum {string} */
        InvitationResponse: "Accept" | "Decline";
        InvitationResponseRequest: {
            response?: components["schemas"]["InvitationResponse"];
        };
        /** @enum {string} */
        InvitationStatus: "Pending" | "Accepted" | "Declined" | "Revoked" | "Expired";
        MeDto: {
            /** Format: uuid */
            id?: string;
            externalSubject?: string | null;
            email?: string | null;
            displayName?: string | null;
            emailVerified?: boolean;
            /** Format: uuid */
            activePracticeId?: string | null;
        };
        MemberDto: {
            /** Format: uuid */
            userId?: string;
            email?: string | null;
            displayName?: string | null;
            role?: components["schemas"]["PracticeRole"];
            version?: string | null;
        };
        PageRequest: {
            title?: string | null;
            documentJson?: string | null;
        };
        PracticeDto: {
            /** Format: uuid */
            id?: string;
            name?: string | null;
            slug?: string | null;
            role?: components["schemas"]["PracticeRole"];
            /** Format: date-time */
            createdAt?: string;
            version?: string | null;
        };
        PracticePageDto: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            practiceId?: string;
            slug?: string | null;
            title?: string | null;
            documentJson?: string | null;
            /** Format: date-time */
            updatedAt?: string;
            version?: string | null;
        };
        /** @enum {string} */
        PracticeRole: "Member" | "Administrator" | "Owner";
        SearchResultDto: {
            kind?: string | null;
            /** Format: uuid */
            id?: string;
            title?: string | null;
            practiceId?: string | null;
            snippet?: string | null;
        };
        TemplateRequest: {
            name?: string | null;
            definitionJson?: string | null;
            publish?: boolean;
        };
        /** @enum {string} */
        TemplateVersionStatus: "Draft" | "Published" | "Archived";
        TransferOwnershipRequest: {
            /** Format: uuid */
            newOwnerId?: string;
        };
        UpdateMemberRequest: {
            role?: components["schemas"]["PracticeRole"];
        };
        UpdatePracticeRequest: {
            name?: string | null;
            slug?: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;