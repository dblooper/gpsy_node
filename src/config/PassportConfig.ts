import passport from 'passport';
import LocalStrategy from 'passport-local';
import * as bcrypt from 'bcrypt';
import { User } from '../entity/User';
import { ApiResponse } from '../apiResponse/ApiResponse';
import { ApiError } from '../apiResponse/ApiError';

export class PassportConfig {

    private userRepository;

    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    setPassportConfig() {
        passport.use(new LocalStrategy({
            usernameField: undefined,
            passwordFiled: undefined
        }, (login, password, done) => {
            this.userRepository.findOne(login)
                .then(async (user: User) => {
                    if(!user || !await bcrypt.compare(password, user.getPassword())) {
                        return done(null, false, new ApiResponse(new ApiError(1, `username or password invalid`)))
                    }
                    return done(null, user)
                })
                .catch(done => console.log(done)) 
            }
        ))
    }

}