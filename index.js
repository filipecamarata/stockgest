//Inportação das bibliotecas
const express = require('express')
const exphbs = require('express-handlebars')
const mysql = require('mysql')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const flash = require('express-flash')

const app = express()

//Porta do servidor
const port = 3002

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


//session midleware
app.use(
    session({
        name: 'session',
        secret: 'nosso_secret',
        resave: false,
        saveUninitialized: false,
        store: new FileStore({
            logFn: function() {},
            path: require('path').join(require('os').tmpdir(), 'sessions')
        }),
        cookie:{
            secure: false,
            maxAge:360000,
            expires: new Date(Date.now() + 360000),
            httpOnly: true
        }
    })
)
  
// flash menssages
app.use(flash())

// set session to res
app.use((req, res, next) => {
    // console.log(req.session)
    console.log(req.session.userid);
  
    if (req.session.userid) {
      res.locals.session = req.session;
    }
  
    next()
  })

  //Rotas do projecto


//Rota de login
app.get('/login', (req, res) =>{
    res.render('login')
})

//Rota de registro
app.get('/registrar', (req, res) =>{
    res.render('cadastroUser')
})

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
    const sqlQuery = `SELECT u.name user, p.id, p.name product,  c.name category , p.amount, p.updated_at FROM products AS p join category AS c
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


//Rota para editar produto
app.get('/product/edit/:id', (req, res) =>{
    const id = req.params.id
    const sqlQuery = `SELECT * FROM products WHERE id = ${id}`
    conexao.query(sqlQuery, (err, data) =>{
        if(err){
            console.log(err)
            return
        }
        const product = data[0]
        res.render('editProduto', {product})
    })
})


//Rota para actualizar os produtos
app.post('/update-product', (req, res) =>{
    const id = req.body.id
    const name = req.body.name
    const amount = req.body.amount
    const categoria = req.body.categoria

    const sqlQuery = `UPDATE products SET name ='${name}', amount=${amount}, category_id='${categoria}' WHERE id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        res.redirect('/products')
    })
})  

//Rota para eliminar produtos
app.post('/delete/product', (req, res) =>{
    const id = req.body.id
    const sqlQuery = `DELETE FROM products WHERE id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        res.redirect('/products')
    })
})

//Rota para filtrar produtos
app.post('/filtro', (req, res) =>{
    const categoria = req.body.categoria

    if (!categoria) {
        return res.status(400).send("Categoria não fornecida");
    }

    const sqlQuery = `SELECT u.name user, p.id, p.name product,  c.name category , p.amount, p.updated_at FROM products AS p join category AS c
    on c.id = p.category_id join user AS u on p.user_id = u.id
    WHERE p.category_id = ${categoria}`

    conexao.query(sqlQuery, (err, data) =>{
        if(err){
            console.log(err)
            return
        }
        const products = data
        res.render('produtos', {products})
    })
})

//Rota para adicionar produtos na lista de compras
app.post('/listaCompras', (req, res) =>{
    const id = req.body.id
    const name = req.body.name
    const done = req.body.done

    //checando se o produto ja foi adicionado
    const sqlCheck = `SELECT name prod FROM listCompras Where product_id = ${id}`
    conexao.query(sqlCheck, (err, data) =>{
        if(err){
            console.log(err)
            return
        }        
       
        if(data.length > 0){
            console.log(data) 
            console.log(`Produto ja adicionado na lista de compras`)
            //mensagens
            res.redirect('/listaCompras')
          
        } else{
            const sqlQuery = `INSERT INTO listCompras (product_id, name, done) values (${id}, '${name}', ${done}) `
            conexao.query(sqlQuery, (err) =>{
            if(err){
                console.log(err)            
                return
            }
            const sql = `SELECT product_id,  name, done FROM listCompras`
            conexao.query(sql, (err, data) =>{
                if(err){
                    console.log(err)
                    return
                }
                const list = data
                console.log(list)
                res.render('listaCompras', {list})
            })
       
        })
        }

        
    })

   

})

//Rota para abrir a lista de compras
app.get('/listaCompras', (req, res) =>{

   const sql = `SELECT product_id, name, done FROM listCompras`
        conexao.query(sql, (err, data) =>{
            if(err){
                console.log(err)
                return
            }
            const list = data
            console.log(list)
            res.render('listaCompras', {list})
        })
})

//Rota para actualizar a lista de compras
app.post('/updateStatus', (req, res)=>{
    const id = req.body.idp
    const done = req.body.done === '0' ? 1 : 0
       
    const sqlQuery = `UPDATE listCompras SET done =${done} WHERE product_id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        console.log(id)
        res.redirect('/listaCompras')
    })  

})

//Rota para remover produto da lista de compras
app.post('/removerProduto', (req, res) =>{
    const id = req.body.idr

    const sqlQuery = `DELETE FROM listCompras WHERE product_id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        res.redirect('/listaCompras')
    })
})

//Rota da Home
app.get("/", (req, res) =>{
    const sqlQuery = `SELECT u.name user, p.id, p.name product,  c.name category , p.amount, p.updated_at FROM products AS p join category AS c
    on c.id = p.category_id join user AS u on p.user_id = u.id    
    `
  
    conexao.query(sqlQuery, (err, data) =>{
        if(err){
            console.log(err)
            return
        }
        const products = data                
        console.log(products)
       
        res.render('home', {products})
        
    })   
       
       
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

