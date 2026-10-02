CREATE DATABASE IF NOT EXISTS khushi_birthday
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE khushi_birthday;

CREATE TABLE IF NOT EXISTS birthday_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_created_at_id (created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
