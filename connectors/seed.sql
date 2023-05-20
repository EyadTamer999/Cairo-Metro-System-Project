-- Insert Roles
INSERT INTO roles("role")
	VALUES ('user');
INSERT INTO roles("role")
	VALUES ('admin');
INSERT INTO roles("role")
	VALUES ('senior');	
-- Set user role as Admin
UPDATE users
	SET roleId=2
	WHERE "email"='desoukya@gmail.com';