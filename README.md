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
                DROP TABLE IF EXISTS HelpTempTable;
                CREATE TEMPORARY TABLE TempTable (
                    spotifyTrackId varchar(255), 
                    userId varchar(255), 
                    recentlyPlayed datetime,
                    timesPlayed int,
                    genre varchar(255)
                );
                CREATE TEMPORARY TABLE HelpTempTable (
                    spotifyTrackId varchar(255), 
                    userId varchar(255), 
                    recentlyPlayed datetime,
                    timesPlayed int,
                    genre varchar(255)
                );

                INSERT INTO TempTable 
                    (select 
                        rp.spotifyTrackId
                        ,rp.userId
                        ,(
                            select rp2.playedAt from recently_played_tracks as rp2 where rp2.userId = rp.userId and rp2.spotifyTrackId = rp.spotifyTrackId order by rp2.playedAt desc limit 1
                        ) as 'recentlyPlayed'
                        ,count(rp.spotifyTrackId) as timesPlayed
                        ,g.genre1
                        from recently_played_tracks as rp
                        inner join spotify_track as st
                            on rp.spotifyTrackId = st.trackId
                        inner join track_genres as g 
                            on g.trackId = st.trackId
                        where
                            rp.userId = spotifyId
                        group by
                            rp.spotifyTrackId
                            ,rp.userId
                        order by 
                            count(rp.spotifyTrackId) desc);
            
                INSERT INTO HelpTempTable
                    SELECT * FROM TempTable;
                    
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
                    
                -- INSERTING NEW GENRES
                INSERT INTO genres_popularity_calc(userId, genre, genrePopularity, insertDate)
                    SELECT
                        R.userId
                        , R.genre
                        , cast((sum(R.timesPlayed)/(select
                                                                    sum(R3.timesPlayed)
                                                                from HelpTempTable as R3 
                                                                where R3.userId = R.userId  
                                                                group by
                                                                    R3.userId) * 100) as decimal(20,3))
                        ,NOW()
                    FROM TempTable as R
                    left join genres_popularity_calc as GC
                        on R.genre = GC.genre
                        and R.userId = GC.userId
                    where GC.genre is null
                    group by
                        R.userId
                        , R.genre;
    -- 
                -- UPDATING EXISTING GENRES
                UPDATE genres_popularity_calc as GC
                INNER JOIN (select 
                                    R2.genre as genre
                                    , R2.userId as userId
                                    , cast((sum(R2.timesPlayed)/ (select
                                                                sum(R4.timesPlayed)
                                                            from HelpTempTable as R4 
                                                            where R4.userId = R2.userId  
                                                            group by
                                                                R4.userId) * 100) as decimal(20,3) ) as genresPopularity
                                from TempTable as R2 
                                group by
                                    R2.genre,
                                    R2.userId
                            ) as R
                    on GC.genre = R.genre
                    and GC.userId = R.userId
                SET GC.genrePopularity = R.genresPopularity
                WHERE GC.genrePopularity <> R.genresPopularity;

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
