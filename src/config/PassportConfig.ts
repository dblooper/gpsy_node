import passport from 'passport';
import LocalStrategy from 'passport-local';
import * as bcrypt from 'bcrypt';

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
                .then(async (user) => {
                    if(!user || !await bcrypt.compare(password, user.password)) {
                        return done(null, false, {errors: {'username or password': 'invalid'}})
                    }
                    return done(null, user)
                })
                .catch(done => console.log(done)) 
            }
        ))
    }

}