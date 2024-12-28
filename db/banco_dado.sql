create database  if not exists  stockgest;
use stockgest;

CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(90) not null ,
  `email` varchar(90) not null ,
  `number_phone` varchar(16) not null,
  `password` varchar(200) not null ,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)default charset utf8;


CREATE TABLE IF NOT EXISTS `category`(
 id int not null  auto_increment primary key,
 `name` varchar(50) not null unique,
 `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
`updated_at` timestamp DEFAULT  CURRENT_TIMESTAMP ON UPDATE  CURRENT_TIMESTAMP
)default charset utf8;


CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int not null ,
  `category_id` int not null,
  `name` varchar(80) not null,
  `amount` int not null,
  `path_img` varchar(200),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_id_fk_products` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `category_id_fk_products` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
)default charset utf8;
