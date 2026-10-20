-- MahaSetu XAMPP database
-- Import this file in phpMyAdmin or run it in MySQL.

CREATE DATABASE IF NOT EXISTS mahasetu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mahasetu;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS application_status_history;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
    email VARCHAR(190) NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_mobile (mobile),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE services (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    department VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_service_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id VARCHAR(32) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    applicant_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
    email VARCHAR(190) NULL,
    details TEXT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_application_id (application_id),
    KEY idx_app_user (user_id),
    KEY idx_app_service (service_id),
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_status_history (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    application_id INT UNSIGNED NOT NULL,
    status VARCHAR(40) NOT NULL,
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_history_application (application_id),
    CONSTRAINT fk_history_application
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO services (name, department, department_code, description) VALUES
('Income Certificate', 'Revenue', 'REV', 'Apply for an official income certificate.'),
('Domicile Certificate', 'Revenue', 'REV', 'Apply for proof of domicile/residence.'),
('Caste Certificate', 'Revenue', 'REV', 'Submit a request for a caste certificate.'),
('Birth Certificate', 'Health', 'HLT', 'Request a birth certificate service.'),
('Scholarship Services', 'Education', 'EDU', 'Explore and apply for scholarship services.'),
('Transport Services', 'Transport', 'TRN', 'Access selected transport-related services.');

-- Demo login is NOT inserted because passwords should be created through registration.
