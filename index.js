//Inportação das bibliotecas
const express = require('express')
const exphbs = require('express-handlebars')
const mysql = require('mysql')

const app = express()

//Porta do servidor
const port = 3000

//Configuração do handlebars
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')

app.use(express.urlencoded({
    extended: true
}))

//Configuração para ler dados do body
app.set(express.json())

//Configuração do css
app.use(express.static('public'))


//Rotas do projecto


//Rota para cadastro de produto
app.get('/add', (req, res) =>{
    const sqlQuery = `SELECT id FROM user WHERE email = 'filipeedvandro942@gmail.com'`
    conexao.query(sqlQuery, (err, data)=>{
        if(err){
            console.log(err)
            return
        }
        const identificador = data
        console.log(identificador)
        res.render('cadastro', {identificador})
    })

    
})

//Rota para salvar os dados do produto na bd
app.post('/save-product', (req, res) =>{
    const user_id = req.body.id
    const nome = req.body.name
    const quantidade = req.body.amount
    const categoria = req.body.categoria

    const sqlQuery = `INSERT INTO products (user_id, category_id, name, amount)
                    values('${user_id}', '${categoria}', '${nome}', '${quantidade}')`
    
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }

        res.redirect('/add')
    })

})


//Rota para acessar os produtos
app.get('/products', (req, res) =>{
    const sqlQuery = `SELECT u.name user, p.name product,  c.name category , p.amount, p.updated_at FROM products AS p join category AS c
    on c.id = p.category_id join user AS u on p.user_id = u.id`
    
    conexao.query(sqlQuery, (err, data) =>{
        if(err){
            console.log(err)
            return
        }
        const products = data
        console.log(products)
        res.render('produtos', {products})
    })

    
})

app.get("/", (req, res) =>{
    res.render('home')
})





//Conexão com banco de dados

const conexao = mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: '4454fili',
    database: 'stockgest'
})


conexao.connect(function(err){
    if(err){
        console.log(`Falha ao conectar o banco de dados ${err}`)
        return
    }

    console.log('App conectada ao banco de dados')
    app.listen(port)
})
