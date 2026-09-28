-- Grant basic campus context to each official role while request handlers still enforce membership and scope.
INSERT INTO "RolePermission" ("roleKey", "permissionCode") VALUES
('PLATFORM_ADMIN','campus.read'),
('SCHOOL_ADMIN','campus.read'),
('PRINCIPAL','campus.read'),
('CAMPUS_HEAD','campus.read'),
('ACADEMIC_COORDINATOR','campus.read'),
('TEACHER','campus.read'),
('FORM_TEACHER','campus.read'),
('FINANCE_OFFICER','campus.read'),
('PARENT','campus.read'),
('STUDENT','campus.read'),
('DRIVER','campus.read'),
('TRANSPORT_MANAGER','campus.read'),
('ADMISSIONS_OFFICER','campus.read'),
('CONTENT_MEDIA_MANAGER','campus.read')
ON CONFLICT ("roleKey", "permissionCode") DO NOTHING;
