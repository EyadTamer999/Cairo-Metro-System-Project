-- Insert Roles
INSERT INTO se_project.roles("role")
	VALUES ('user');
INSERT INTO se_project.roles("role")
	VALUES ('admin');
INSERT INTO se_project.roles("role")
	VALUES ('senior');	
-- Set user role as Admin
UPDATE se_project.users
	SET "roleId"=2
	WHERE "email"='desoukya@gmail.com';