DROP TABLE IF EXISTS `note_tombstones`;
CREATE TABLE `note_tombstones` (
  `id` int(11) NOT NULL auto_increment,
  `uuid` char(64) default NULL,
  `created` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=60 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `notes`;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL auto_increment,
  `uuid` char(64) default NULL,
  `etag` char(64) default NULL,
  `name` varchar(255) default NULL,
  `text` text,
  `created` datetime default NULL,
  `modified` datetime default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=62 DEFAULT CHARSET=utf8;
