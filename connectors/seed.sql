-- Insert Roles
INSERT INTO roles("role")
	VALUES ('user');
INSERT INTO roles("role")
	VALUES ('admin');
INSERT INTO roles("role")
	VALUES ('senior');	
-- Set user role as Admin
<<<<<<< HEAD
UPDATE users
	SET roleId=2
	WHERE "email"='desoukya@gmail.com';
=======
UPDATE se_project.users
SET roleId=2
WHERE "email" = 'desoukya@gmail.com';
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
