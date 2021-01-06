# gpsy spotify playlist generator

Steps to run this project:
1. settle your database settings => create the ormconfig.json in the root folder of the project the example below
        {
        "type": "mysql",
        "host": "localhost",
        "port": 3306,
        "username": "name",
        "password": "password",
        "database": "gpsy",
        "charset": "utf8mb4",
        "collation": "utf8mb4_unicode_ci",
        "synchronize": true,
        "logging": false,
        "entities": [
            "src/entity/**/*.ts"
        ],
        "migrations": [
            "src/migration/**/*.ts"
        ],
        "subscribers": [
            "src/subscriber/**/*.ts"
        ],
        "cli": {
            "entitiesDir": "src/entity",
            "migrationsDir": "src/migration",
            "subscribersDir": "src/subscriber"
        }
        }

2. create proceudre in your db - just copy paste to mysql and run
        DELIMITER $$
        DROP PROCEDURE IF EXISTS calc_track_popularity$$
        CREATE PROCEDURE calc_track_popularity()
        BEGIN 
            DECLARE done INT default FALSE;
            DECLARE spotifyId VARCHAR(255);
            DECLARE userCursor CURSOR FOR SELECT u.id FROM user as u;
            DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
            
            OPEN userCursor;
            
            read_loop: LOOP
                FETCH userCursor INTO spotifyId;
                IF(done) THEN
                    LEAVE read_loop;
                END IF;
                IF spotifyId <> '' THEN
                    DROP TABLE IF EXISTS TempTable;
                    CREATE TEMPORARY TABLE TempTable (
                        spotifyTrackId varchar(255), 
                        userId varchar(255), 
                        recentlyPlayed datetime,
                        timesPlayed int
                    );

                    INSERT INTO TempTable 
                        (select 
                            rp.spotifyTrackId
                            ,rp.userId
                            ,(
                                select rp2.playedAt from recently_played_tracks as rp2 where rp2.userId = rp.userId and rp2.spotifyTrackId = rp.spotifyTrackId order by rp2.playedAt desc limit 1
                            ) as 'recentlyPlayed'
                            ,count(rp.spotifyTrackId) as "timesPlayed" 
                            from recently_played_tracks as rp
                            inner join spotify_track as st
                                on rp.spotifyTrackId = st.trackId
                            where
                                rp.userId = spotifyId
                            group by
                                rp.spotifyTrackId
                                ,rp.userId
                            order by 
                                count(rp.spotifyTrackId) desc);
                                
                    -- INSERTING NEW TRACKS PLAYED
                    INSERT INTO track_popularity_calc(userId, spotifyTrackId, recentlyPlayed, popularity)
                    SELECT
                        R.userId,
                        R.spotifyTrackId
                        , R.recentlyPlayed
                        , R.timesPlayed
                    FROM TempTable as R
                    left join track_popularity_calc as PC
                        on R.spotifyTrackId = PC.spotifyTrackId
                        and R.userId = PC.userId
                    where PC.spotifyTrackId is null;

                    -- UPDATING EXISTING TRACKS PLAYED
                    UPDATE track_popularity_calc as PC 
                    INNER JOIN TempTable as R
                        on R.spotifyTrackId = PC.spotifyTrackId
                        and R.userId = PC.userId
                    SET PC.popularity = R.timesPlayed
                        ,PC.recentlyPlayed = R.recentlyPlayed
                        WHERE PC.popularity <> R.timesPlayed
                        OR PC.recentlyPlayed <> R.recentlyPlayed;

                    TRUNCATE TABLE TempTable;
                END IF;
            END LOOP;
            DROP TABLE IF EXISTS TempTable;
            CLOSE userCursor;
            
        END$$
        DELIMITER ;

3. Create .env file in the root of the project and set the variables:
    PORT=8080
    CLIENT_ID=yourSpotifyAppClientId => more here https://developer.spotify.com/dashboard/
    CLIENT_SECRET=yourSpotifyAppClientSecret => more here https://developer.spotify.com/dashboard/

4. Run `npm start` command
