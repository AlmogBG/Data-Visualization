DROP TABLE IF EXISTS passwords;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin_users;

CREATE TABLE IF NOT EXISTS users (
    id_number VARCHAR(20) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Manager', 'Management Employee')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS passwords (
    id_number VARCHAR(20) PRIMARY KEY,
    password_hash TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_passwords_users
        FOREIGN KEY (id_number)
        REFERENCES users(id_number)
        ON DELETE CASCADE
);

INSERT INTO users (id_number, username, full_name, email, role)
VALUES (
    '208029189',
    'yeuda',
    'Yeuda Baza',
    'yeuda4222@gmail.com',
    'Management Employee'
)
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO passwords (id_number, password_hash)
VALUES (
    '208029189',
    '$2b$10$A.HwmzZO.JBop11AHt6tt.KRA7mAPG8Ilfe2KgquuT7oHhqQw36E2'
)
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO users (id_number, username, full_name, email, role)
VALUES (
    '123456789',
    'inbal',
    'inbal',
    'inbal@example.com',
    'Manager'
)
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO passwords (id_number, password_hash)
VALUES (
    '123456789',
    '$2b$10$A.HwmzZO.JBop11AHt6tt.KRA7mAPG8Ilfe2KgquuT7oHhqQw36E2'
)
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO users (id_number, username, full_name, email, role)
VALUES (
    '123456781',
    'almog',
    'almog ben gur',
    'almog@gmail.com',
    'Management Employee'
)
ON CONFLICT (id_number) DO NOTHING;

INSERT INTO passwords (id_number, password_hash)
VALUES (
    '123456781',
    '$2a$10$FcMy7/fRe3O9MI2TZo5lnu1uLBycAHY3VHrunoRuEeJZuse2.Lrrq'
)
ON CONFLICT (id_number) DO NOTHING;