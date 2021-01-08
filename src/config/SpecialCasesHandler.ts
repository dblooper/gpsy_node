
export class SpecialCasesHandler {

    static async hasInternetConnection() {
        try {
            await require('dns').promises.resolve('www.google.com');
            return true;
        } catch(err) {
            console.log(err);
            console.error(`[${new Date().toISOString()}] No internet connection`);
            return false;
        }
    }
}