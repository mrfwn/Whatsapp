const connection = require("./dbConnection")()

class Db{
    constructor(db){
        this.db = db
    }

    insertUser = (message)=>{

    }

    insertMessage = (number,)=>{

    }


}
module.exports = new Db(connection)