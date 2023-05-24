-- DROP TABLE IF EXISTS se_project.users;
-- DROP TABLE IF EXISTS roles;
-- DROP TABLE IF EXISTS faculties;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS enrollments;
--- Note in pgadmin columns name will be lowerCase 
--so either change them from pgadmin or change in the code to lower
CREATE SCHEMA IF NOT EXISTS se_project;

CREATE TABLE IF NOT EXISTS se_project.users
(
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    roleid integer NOT NULL
);


CREATE TABLE IF NOT EXISTS se_project.sessions
(
    id SERIAL PRIMARY KEY,
    userid integer NOT NULL,
    token text NOT NULL,
    expiresat timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS se_project.roles
(
    id SERIAL,
    role text NOT NULL,
    PRIMARY KEY (id)
);


CREATE TABLE IF NOT EXISTS se_project.zones
(
    id SERIAL,
    zonetype text NOT NULL,
    price INTEGER NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS se_project.subsription
(
    id SERIAL PRIMARY KEY,
    subtype text NOT NULL,
    zoneid Integer NOT NULL,
    userid INTEGER NOT NULL,
    nooftickets INTEGER NOT NULL,
    FOREIGN KEY( userid ) REFERENCES se_project.users,
    FOREIGN KEY( zoneid ) REFERENCES se_project.zones
);


CREATE TABLE IF NOT EXISTS se_project.tickets
(
    id SERIAL PRIMARY KEY,
    origin text NOT NULL,
    destination text NOT NULL,
    userid INTEGER NOT Null,
    subiD INTEGER,
    tripdate timestamp not Null,
    FOREIGN KEY( userid ) REFERENCES se_project.users,
    FOREIGN KEY( subid ) REFERENCES se_project.subsription
);


CREATE TABLE IF NOT EXISTS se_project.rides
(
    id SERIAL PRIMARY KEY NOT NULL,
    status text NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    userid INTEGER NOT NULL,
    ticketid integer not null,
    tripdate timestamp not null,
    FOREIGN KEY( userid ) REFERENCES se_project.users,
    FOREIGN KEY( ticketid ) REFERENCES se_project.rides
);


CREATE TABLE IF NOT EXISTS se_project.transactions (
  id SERIAL PRIMARY KEY,
  amount INTEGER NOT NULL,
  userid INTEGER NOT NULL,
  purchasedIid text NOT NULL,
  FOREIGN KEY(userid) REFERENCES se_project.users
);



CREATE TABLE IF NOT EXISTS se_project.refund_requests (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status text NOT NULL,
  userid Integer NOT NULL,
  refundamount INTEGER not NULL,
  ticketid INTEGER NOT null,
  FOREIGN KEY(userid) REFERENCES se_project.users,
  FOREIGN KEY(ticketid) REFERENCES se_project.tickets
);

CREATE TABLE IF NOT EXISTS se_project.senior_requests (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status text NOT NULL,
  userid Integer NOT NULL,
  nationalid INTEGER not null,
  FOREIGN KEY(userid) REFERENCES se_project.users
);

CREATE TABLE IF NOT EXISTS se_project.stations (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  stationname text NOT NULL,
  stationtype text NOT NULL,--normal or transfer
  stationposition text,--start middle end
  stationstatus text not null--new created or not
);

CREATE TABLE IF NOT EXISTS se_project.routes (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  routename text Not null,
  fromStationid INTEGER NOT NULL,
  toStationid INTEGER NOT NULL,
  FOREIGN KEY(fromStationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
  FOREIGN KEY(toStationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS se_project.stationroutes (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  stationid INTEGER NOT NULL,
  routeid INTEGER NOT NULL,
  FOREIGN KEY(stationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
  FOREIGN KEY(routeid) REFERENCES se_project.routes on DELETE CASCADE on UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS se_project.creditCardDetails---------------------------------------------------------
(
    id SERIAL NOT NULL,
    holder_name text NOT NULL,
    creditCardNumber INTEGER NOT Null,
    userId INTEGER NOT Null,
    transactions_id INTEGER NOT Null,
    FOREIGN KEY( transactions_id ) REFERENCES se_project.transactions,
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    CONSTRAINT cc_pkey PRIMARY KEY (id)
);
