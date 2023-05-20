-- DROP TABLE IF EXISTS se_project.users;
-- DROP TABLE IF EXISTS roles;
-- DROP TABLE IF EXISTS faculties;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS enrollments;
--- Note in pgadmin columns name will be lowerCase 
--so either change them from pgadmin or change in the code to lower
CREATE TABLE IF NOT EXISTS se_project.users
(
    id SERIAL NOT NULL,
    firstName text NOT NULL,
    lastName text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    roleId integer NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.sessions
(
    id SERIAL NOT NULL,
    userId integer NOT NULL,
    token text NOT NULL,
    expiresAt timestamp NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.roles
(
    id SERIAL NOT NULL,
    role text NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS se_project.zones
(
    id SERIAL NOT NULL,
    zoneType text NOT NULL, -- 9 stations/ 10-16/16
    price INTEGER NOT NULL,
    CONSTRAINT zones_pkey PRIMARY KEY (id)

);
CREATE TABLE IF NOT EXISTS se_project.subsription
(
    id SERIAL NOT NULL,
    subType text NOT NULL, --annual --month -- quarterly
    zoneId Integer NOT NULL,
    userId INTEGER NOT NULL,
    noOfTickets INTEGER NOT NULL,
    CONSTRAINT subsription_pkey PRIMARY KEY (id),
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    FOREIGN KEY( zoneId ) REFERENCES se_project.zones

);
CREATE TABLE IF NOT EXISTS se_project.tickets
(
    id SERIAL NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    userId INTEGER NOT Null,
    subID INTEGER,
    tripDate timestamp not Null,
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    FOREIGN KEY( subID ) REFERENCES se_project.subsription,
    CONSTRAINT tickets_pkey PRIMARY KEY (id)
);



CREATE TABLE IF NOT EXISTS se_project.rides
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    origin text NOT NULL, 
    destination text NOT NULL, 
    userId INTEGER NOT NULL,
    ticketId integer not null,
    tripDate timestamp not null,
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    FOREIGN KEY( ticketId ) REFERENCES se_project.rides,
    CONSTRAINT rides_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.transactions
(
    id SERIAL NOT NULL,
    amount INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    purchasedId text NOT NULL, 
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.refund_requests
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    userId Integer NOT NULL, 
    refundAmount INTEGER not NULL,
    ticketId INTEGER NOT null,
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    FOREIGN KEY( ticketId ) REFERENCES se_project.tickets,
    CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.senior_requests
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    userId Integer NOT NULL, 
    nationalId INTEGER not null,
    FOREIGN KEY( userId ) REFERENCES se_project.users,
    CONSTRAINT senior_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.stations
(
    id SERIAL NOT NULL,
    stationName text NOT NULL,
    stationType text NOT NULL, -- normal or transfer
    stationPosition text, -- start middle end
    stationStatus text not null, -- new created or not
    CONSTRAINT stations_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS se_project.routes
(
    id SERIAL NOT NULL,
    routeName text Not null,
    fromStationId INTEGER NOT NULL,
    toStationId INTEGER NOT NULL, 
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    FOREIGN KEY( fromStationId ) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( toStationId ) REFERENCES se_project.stations  on DELETE CASCADE on UPDATE CASCADE

);

CREATE TABLE IF NOT EXISTS se_project.stationRoutes
(
    id SERIAL NOT NULL,
    stationId INTEGER NOT NULL,
    routeId INTEGER NOT NULL, 
    CONSTRAINT stationRoutes_pkey PRIMARY KEY (id),
    FOREIGN KEY( stationId ) REFERENCES se_project.stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( routeId ) REFERENCES se_project.routes on DELETE CASCADE on UPDATE CASCADE
);

