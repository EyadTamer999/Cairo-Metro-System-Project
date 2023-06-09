-- DROP TABLE IF EXISTS se_project.users;
-- DROP TABLE IF EXISTS se_project.roles;
-- DROP TABLE IF EXISTS se_project.faculties;
-- DROP TABLE IF EXISTS se_project.subsription;
-- DROP TABLE IF EXISTS se_project.sessions;
-- DROP TABLE IF EXISTS se_project.enrollments;
--- Note in pgadmin columns name will be lowerCase
--so either change them from pgadmin or change in the code to lower
CREATE TABLE IF NOT EXISTS users
(
    id        SERIAL  NOT NULL,
    firstname text    NOT NULL,
    lastname  text    NOT NULL,
    email     text    NOT NULL,
    password  text    NOT NULL,
    roleid    integer NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS sessions
(
    id        SERIAL    NOT NULL,
    userid    integer   NOT NULL,
    token     text      NOT NULL,
    expiresat timestamp NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS roles
(
    id   SERIAL NOT NULL,
    role text   NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS zones
(
    id       SERIAL  NOT NULL,
    zonetype text    NOT NULL, -- 9 stations/ 10-16/16
    price    INTEGER NOT NULL,
    CONSTRAINT zones_pkey PRIMARY KEY (id)

);
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> b79762399366305b2401ffa08b946d4a646c0275
CREATE TABLE IF NOT EXISTS se_project.subscription
=======
CREATE TABLE IF NOT EXISTS subscription
>>>>>>> 0d736c1a6f85b90f49ff7794cf47398d3a018650
=======
CREATE TABLE IF NOT EXISTS subscription
>>>>>>> 79148bb9c9e22cb11bf793300ef2a206c729741b
(
    id          SERIAL  NOT NULL,
    subtype     text    NOT NULL, --annual --month -- quarterly
    zoneid      Integer NOT NULL,
    userid      INTEGER NOT NULL,
    nooftickets INTEGER NOT NULL,
    CONSTRAINT subscriptions PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (zoneid) REFERENCES se_project.zones

);
CREATE TABLE IF NOT EXISTS tickets
(
    id          SERIAL    NOT NULL,
    origin      text      NOT NULL,
    destination text      NOT NULL,
    userid      INTEGER   NOT Null,
    subid       INTEGER,
    tripdate    timestamp not Null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (subid) REFERENCES se_project.subscription,
    CONSTRAINT tickets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS se_project.rides
(
    id          SERIAL    NOT NULL,
    status      text      NOT NULL,
    origin      text      NOT NULL,
    destination text      NOT NULL,
    userid      INTEGER   NOT NULL,
    ticketid    integer   not null,
    tripdate    timestamp not null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (ticketid) REFERENCES se_project.tickets,
    CONSTRAINT rides_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS transactions
(
    id           SERIAL  NOT NULL,
    amount       FLOAT NOT NULL, --should be FLOATs
    userid       INTEGER NOT NULL,
    purchasedid text    NOT NULL,
    purchasetype text    NOT NULL, --cash or subscription
    FOREIGN KEY (userid) REFERENCES se_project.users,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS refund_requests
(
    id           SERIAL  NOT NULL,
    status       text    NOT NULL,
    userid       Integer NOT NULL,
    refundamount INTEGER not NULL,
    ticketid     INTEGER NOT null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (ticketid) REFERENCES se_project.tickets,
    CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS senior_requests
(
    id         SERIAL  NOT NULL,
    status     text    NOT NULL,
    userid     Integer NOT NULL,
    nationalid text not null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
    CONSTRAINT senior_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS stations
(
    id              SERIAL NOT NULL,
    stationname     text   NOT NULL,
    stationtype     text   NOT NULL, -- normal or transfer
    stationposition text,            -- start middle end
    stationstatus   text   not null, -- new created or not
    CONSTRAINT stations_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS routes
(
    id            SERIAL  NOT NULL,
    routename     text    Not null,
    fromstationid INTEGER NOT NULL,
    tostationid   INTEGER NOT NULL,
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    FOREIGN KEY (fromstationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY (tostationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE

);

CREATE TABLE IF NOT EXISTS se_project.stationroutes
(
    id        SERIAL  NOT NULL,
    stationid INTEGER NOT NULL,
    routeid   INTEGER NOT NULL,
    CONSTRAINT stationroutes_pkey PRIMARY KEY (id),
    FOREIGN KEY (stationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY (routeid) REFERENCES se_project.routes on DELETE CASCADE on UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS se_project.creditcarddetails
(
    id SERIAL NOT NULL,
    holder_name text NOT NULL,
    creditcardnumber INTEGER NOT Null,
    userid INTEGER NOT Null,
    FOREIGN KEY( userid ) REFERENCES se_project.users,
    CONSTRAINT cc_pkey PRIMARY KEY (id)
<<<<<<< HEAD
<<<<<<< HEAD
);
=======
);
>>>>>>> b79762399366305b2401ffa08b946d4a646c0275
=======
);
>>>>>>> 79148bb9c9e22cb11bf793300ef2a206c729741b
