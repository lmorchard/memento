DROP TABLE IF EXISTS `login_email_verification_tokens`;
CREATE TABLE `login_email_verification_tokens` (
  `id` int(11) NOT NULL auto_increment,
  `login_id` int(11) default NULL,
  `token` varchar(32) default NULL,
  `value` varchar(255) default NULL,
  PRIMARY KEY  (`id`),
  KEY `login_email_verification_tokens_ibfk_2` (`login_id`),
  CONSTRAINT `login_email_verification_tokens_ibfk_2` FOREIGN KEY (`login_id`) REFERENCES `logins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `login_password_reset_tokens`;
CREATE TABLE `login_password_reset_tokens` (
  `id` int(11) NOT NULL auto_increment,
  `login_id` int(11) default NULL,
  `token` varchar(32) default NULL,
  PRIMARY KEY  (`id`),
  KEY `login_password_reset_tokens_ibfk_2` (`login_id`),
  CONSTRAINT `login_password_reset_tokens_ibfk_2` FOREIGN KEY (`login_id`) REFERENCES `logins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `logins`;
CREATE TABLE `logins` (
  `id` int(11) NOT NULL auto_increment,
  `login_name` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(32) NOT NULL,
  `created` datetime default NULL,
  `last_login` datetime default NULL,
  `active` tinyint(2) NOT NULL default '1',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `login_name` (`login_name`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `logins_profiles`;
CREATE TABLE `logins_profiles` (
  `id` int(11) NOT NULL auto_increment,
  `login_id` int(11) NOT NULL,
  `profile_id` int(11) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `login_id_profile_id` (`login_id`,`profile_id`),
  KEY `logins_profiles_ibfk_2` (`profile_id`),
  CONSTRAINT `logins_profiles_ibfk_1` FOREIGN KEY (`login_id`) REFERENCES `logins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `logins_profiles_ibfk_2` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `profile_attributes`;
CREATE TABLE `profile_attributes` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL,
  `name` varchar(255) default NULL,
  `value` text,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `profile_id_name` (`profile_id`,`name`),
  CONSTRAINT `profile_attributes_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` int(11) NOT NULL auto_increment,
  `uuid` varchar(40) NOT NULL,
  `screen_name` varchar(64) NOT NULL,
  `full_name` varchar(128) NOT NULL,
  `bio` text,
  `created` datetime default NULL,
  `last_login` datetime default NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `screen_name` (`screen_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `profiles_roles`;
CREATE TABLE `profiles_roles` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) default NULL,
  `role_id` int(11) default NULL,
  PRIMARY KEY  (`id`),
  KEY `profiles_roles_ibfk_1` (`profile_id`),
  KEY `profiles_roles_ibfk_2` (`role_id`),
  CONSTRAINT `profiles_roles_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `profiles_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
