import { expect } from 'chai';
import { ApiError } from '../src/apiResponse/ApiError';
import { ApiResponse } from '../src/apiResponse/ApiResponse';
import { ApiSuccess } from '../src/apiResponse/ApiSuccess';

describe('Response tests', () => { // the tests container
    it('error response', () => { // the single test
        const errorResponse = new ApiError(0, "Lollipos");
        const apiError = new ApiResponse(errorResponse);
        console.log(JSON.stringify(apiError,null,1));
        expect(apiError.status).to.be.a("number").to.equal(1);
        expect(apiError.message).to.be.an("object").to.have.property("message").to.equal("Lollipos");
                /* detect retina */
        // expect(options.detectRetina).to.be.false; // Do I need to explain anything? It's like writing in English!

        // /* fps limit */
        // expect(options.fpsLimit).to.equal(30); // As I said 3 lines above

        // expect(options.interactivity.modes.emitters).to.be.empty; // emitters property is an array and for this test must be empty, this syntax works with strings too
        // expect(options.particles.color).to.be.an("object").to.have.property("value").to.equal("#fff"); // this is a little more complex, but still really clear
    });
    it('error response', () => { // the single test
        const tempResponse = {
            name: 'Ilas',
            email: 'ilas@temp.pl',
            songs: 'lalalalalla'
        }
        const success = new ApiSuccess(tempResponse);
        const apiSuccess = new ApiResponse(success);
        console.log(JSON.stringify(apiSuccess, null, 1));
        expect(apiSuccess.status).to.be.a("number").to.equal(0);
        expect(apiSuccess.message).to.be.an("object").to.have.property("data").to.have.property('name').to.equal("Ilas");
    });
});

