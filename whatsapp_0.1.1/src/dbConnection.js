var mongo = require('mongodb')

module.exports = ()=>{
    console.log("Conexão com Banco Criada!!")
    var db = new mongo.Db(
        'whatsapp',
        new mongo.Server(
            'localhost',
            27017,
            {}
        ),
        {}
    )

    return db
}