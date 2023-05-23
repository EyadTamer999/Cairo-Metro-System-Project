-- DROP TABLE IF EXISTS se_project.users;
-- DROP TABLE IF EXISTS roles;
-- DROP TABLE IF EXISTS faculties;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS enrollments;
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
CREATE TABLE IF NOT EXISTS subsription --SUBSCRIPTION MISPELLED
(
    id          SERIAL  NOT NULL,
    subtype     text    NOT NULL, --annual --month -- quarterly
    zoneid      Integer NOT NULL,
    userid      INTEGER NOT NULL,
    nooftickets INTEGER NOT NULL,
    CONSTRAINT subsription_pkey PRIMARY KEY (id),
<<<<<<< HEAD
    FOREIGN KEY( userId ) REFERENCES users,
    FOREIGN KEY( zoneId ) REFERENCES zones
=======
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (zoneid) REFERENCES se_project.zones
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244

);
CREATE TABLE IF NOT EXISTS tickets
(
<<<<<<< HEAD
    id SERIAL NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    userId INTEGER NOT Null,
    subID INTEGER,
    tripDate timestamp not Null,
    FOREIGN KEY( userId ) REFERENCES users,
    FOREIGN KEY( subID ) REFERENCES subsription,
    CONSTRAINT tickets_pkey PRIMARY KEY (id)
);



CREATE TABLE IF NOT EXISTS rides
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    origin text NOT NULL, 
    destination text NOT NULL, 
    userId INTEGER NOT NULL,
    ticketId integer not null,
    tripDate timestamp not null,
    FOREIGN KEY( userId ) REFERENCES users,
    FOREIGN KEY( ticketId ) REFERENCES rides,
=======
    id          SERIAL    NOT NULL,
    origin      text      NOT NULL,
    destination text      NOT NULL,
    userid      INTEGER   NOT Null,
    subiD       INTEGER,
    tripdate    timestamp not Null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (subid) REFERENCES se_project.subsription,
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
    FOREIGN KEY (ticketid) REFERENCES se_project.rides,
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
    CONSTRAINT rides_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS transactions
(
<<<<<<< HEAD
    id SERIAL NOT NULL,
    amount INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    purchasedId text NOT NULL, 
    FOREIGN KEY( userId ) REFERENCES users,
=======
    id           SERIAL  NOT NULL,
    amount       INTEGER NOT NULL,
    userid       INTEGER NOT NULL,
    purchasedIid text    NOT NULL,
    FOREIGN KEY (userid) REFERENCES se_project.users,
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS refund_requests
(
<<<<<<< HEAD
    id SERIAL NOT NULL,
    status text NOT NULL,
    userId Integer NOT NULL, 
    refundAmount INTEGER not NULL,
    ticketId INTEGER NOT null,
    FOREIGN KEY( userId ) REFERENCES users,
    FOREIGN KEY( ticketId ) REFERENCES tickets,
=======
    id           SERIAL  NOT NULL,
    status       text    NOT NULL,
    userid       Integer NOT NULL,
    refundamount INTEGER not NULL,
    ticketid     INTEGER NOT null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
    FOREIGN KEY (ticketid) REFERENCES se_project.tickets,
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
    CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS senior_requests
(
<<<<<<< HEAD
    id SERIAL NOT NULL,
    status text NOT NULL,
    userId Integer NOT NULL, 
    nationalId INTEGER not null,
    FOREIGN KEY( userId ) REFERENCES users,
=======
    id         SERIAL  NOT NULL,
    status     text    NOT NULL,
    userid     Integer NOT NULL,
    nationalid INTEGER not null,
    FOREIGN KEY (userid) REFERENCES se_project.users,
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
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
<<<<<<< HEAD
    id SERIAL NOT NULL,
    routeName text Not null,
    fromStationId INTEGER NOT NULL,
    toStationId INTEGER NOT NULL, 
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    FOREIGN KEY( fromStationId ) REFERENCES stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( toStationId ) REFERENCES stations  on DELETE CASCADE on UPDATE CASCADE

);

CREATE TABLE IF NOT EXISTS stationRoutes
(
    id SERIAL NOT NULL,
    stationId INTEGER NOT NULL,
    routeId INTEGER NOT NULL, 
    CONSTRAINT stationRoutes_pkey PRIMARY KEY (id),
    FOREIGN KEY( stationId ) REFERENCES stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( routeId ) REFERENCES routes on DELETE CASCADE on UPDATE CASCADE
);

=======
    id            SERIAL  NOT NULL,
    routename     text    Not null,
    fromStationid INTEGER NOT NULL,
    toStationid   INTEGER NOT NULL,
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    FOREIGN KEY (fromStationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY (toStationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE

);

CREATE TABLE IF NOT EXISTS se_project.stationroutes
(
    id        SERIAL  NOT NULL,
    stationid INTEGER NOT NULL,
    routeid   INTEGER NOT NULL,
    CONSTRAINT stationRoutes_pkey PRIMARY KEY (id),
    FOREIGN KEY (stationid) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY (routeid) REFERENCES se_project.routes on DELETE CASCADE on UPDATE CASCADE
);
>>>>>>> 3d72db100e0683cb5e60d708f9ac3c348fa30244
