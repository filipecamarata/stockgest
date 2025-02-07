//Inportação das bibliotecas
const express = require('express')
const exphbs = require('express-handlebars')
const mysql = require('mysql')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const flash = require('express-flash')
const bcrypt = require('bcryptjs')

//Biblioteca para formatar a data
const { format } = require('date-fns')
const { ptBR } = require('date-fns/locale')

const app = express()

//Porta do servidor
const port = 3002

//helpers
const checkAuth = require('./helpers/auth').checkAuth

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
        resave: true,   // 🔵 Mantém a sessão ativa enquanto o usuário interage
        saveUninitialized: false,
        store: new FileStore({
            logFn: function () {},
            path: require('path').join(require('os').tmpdir(), 'sessions')
        }),
        cookie: {
            secure: false,
            maxAge: 86400000, 
            httpOnly: true
        }
    })
    
)
  
// flash menssages
app.use(flash())

// set session to res
app.use((req, res, next) => {
    res.locals.session = req.session || {}; // 🔵 Garante que session esteja sempre definido
    next();
});


  //Rotas do projecto


//Rota de login
app.get('/login', (req, res) =>{
    res.render('login')
})
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Checando se o email existe (SQL Seguro)
        const sqlCheck = `SELECT * FROM user WHERE email = ?`;
        
        const results = await new Promise((resolve, reject) => {
            conexao.query(sqlCheck, [email], (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        // Verifica se o usuário foi encontrado
        if (results.length === 0) {
            req.flash('message', 'Nenhum usuário encontrado');
            return res.redirect('/login');
        }

        // Usuário encontrado
        const user = results[0];

        // Verifica a senha
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            req.flash('message', 'Senha incorreta');
            return res.redirect('/login');
        }

        // Criar sessão
        req.session.userid = user.id;
        req.flash('message', 'Login realizado com sucesso');

        // Salvar sessão antes de redirecionar
        req.session.save(() => {
            return res.redirect('/');
        });

    } catch (error) {
        console.error('Erro ao processar login:', error);
        req.flash('message', 'Erro ao processar login');
        return res.redirect('/login');
    }
});


app.get('/logout', (req, res) =>{

    req.session.destroy(()=>{        
        res.redirect('/')       
    })

})

//Rota de registro
app.get('/registrar', (req, res) =>{
    res.render('cadastroUser')
})


app.post('/save-user', async (req, res) =>{
    const {name, email, number, password, confpassword} = req.body
    try {
        //checando se o email já existe no bamco de dados
        const sqlCheck = `SELECT * FROM user WHERE email = ?`
        
        const results = await new Promise((resolve, reject) =>{
            conexao.query(sqlCheck,[email],(err, data) =>{
                if(err){
                    console.log(err)
                   return reject(err)
                }
               resolve(data)                 
            })
        })
        
        if(results.length > 0){
            console.log('Usuario ja existe')
            req.flash('message', 'Usuário já existe!!')
            return res.redirect('/registrar')
        }

        //Checando se as senhas são iguais
        if(password !== confpassword){
            req.flash('message', 'Senhas diferentes, tente novamente')
            return res.redirect('/registrar')
        }

        //Criar senha criptografada
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = await bcrypt.hashSync(password, salt)

        //Inserindo dados no banco de dados
        
            const sqlQuery = `INSERT INTO user (name, email, number_phone, password)
            VALUES (?, ?, ?, ?)`
            await new Promise((resolve, reject) =>{
                conexao.query(sqlQuery, [name, email, number, hashedPassword], (err)=>{
                    if(err){
                     console.log(err)
                     return reject(err)                 
                    
                    }resolve()     
                })               
                    
            })

            req.flash('message', 'Cadastro realizado com sucesso')
           return res.redirect('/')
    } catch (error) {
        console.log(error)
    }

})


//Rota para cadastro de produto
app.get('/add', checkAuth, (req, res) =>{
     const id = req.session.userid
    const sqlQuery = `SELECT id FROM user WHERE id = ${id} `
    conexao.query(sqlQuery, (err, data)=>{
        if(err){
         return console.log(err)
           
        }

        //Dados retornados da tabela  user
        const id = data        
        //console.log(identificador)

        //Pegando os dados da tabela img_source
        const sqlImg =`select * from img_source order by name asc`
        conexao.query(sqlImg, (err, data) =>{
            if(err){
              return  console.log(err)           
            }
            
            //Dados retornados da tabela img_source
            const source = data          

            res.render('cadastro', {id, source})
        })
        
    })

    
})

//Rota para salvar os dados do produto na bd
app.post('/save-product', checkAuth, (req, res) =>{
    const user_id = req.body.id
    const nome = req.body.name
    const quantidade = req.body.amount
    const category_id = req.body.categoria
    const img_id = req.body.imagem

    const sqlQuery = `INSERT INTO products (user_id, category_id, img_id, name, amount)
                    values(?, ?, ?, ?, ?)`
    
    conexao.query(sqlQuery, [user_id, category_id, img_id, nome, quantidade ], (err) =>{
        if(err){
            console.log(err)
            return
        }
        req.flash('message', 'Produto cadastrado com sucesso')
        console.log("Mensagem Flash Armazenada: Produto atualizado com sucesso 4"); // <-- Verifique no console

   
        return res.redirect('/add')
    })

})


//Rota para acessar os produtos
app.get('/products', checkAuth, (req, res) =>{
    const message = req.flash('message')[0] || null; // Recupera a mensagem da sessão e / Pegando a primeira mensagem ou null
    //console.log('Mensagem Flash:', message); 

     //Query para selecionar apenas os produtos de alimentação
    const sqlQuery = `SELECT u.name user, p.id, p.name product,  c.name category, i.path , p.amount, p.updated_at FROM products AS p
    join category AS c
    on c.id = p.category_id join user AS u on p.user_id = u.id
    join img_source i on i.id = p.img_id WHERE category_id =1`
    
    conexao.query(sqlQuery, (err, data) =>{
        if(err){
            console.log(err)
            return
        }

        //Converte a data em padrão brasileiro
        const products = data.map(result => ({
            ...result, //Faz um copia do array principal sem modificá-lo
            updated_at: format(new Date(result.updated_at), 'dd/MM/yyyy', { locale: ptBR })          

        }))

        //Query para selecionar apenas os produtos de limpeza
        const sqlQuery2 = `SELECT u.name user, p.id, p.name product,  c.name category, i.path , p.amount, p.updated_at FROM products AS p
            join category AS c
            on c.id = p.category_id join user AS u on p.user_id = u.id
            join img_source i on i.id = p.img_id WHERE category_id =2`
        conexao.query(sqlQuery2, (err, data) =>{
            if(err){
                return console.log(err)
            }
            //Converte a data em padrão brasileiro
            const products2 = data.map(result => ({
                ...result, //Faz um copia do array principal sem modificá-las
                updated_at: format(new Date(result.updated_at), 'dd/MM/yyyy', { locale: ptBR })          
    
            }))

            console.log(products)
       
        res.render('produtos', {products, products2, message})
        })
     
        
    })    
})


//Rota para editar produto
app.get('/product/edit/:id', checkAuth, (req, res) =>{
    const id = req.params.id
    const sqlQuery = `SELECT * FROM products WHERE id = ${id}`
    conexao.query(sqlQuery, (err, data) =>{
        if(err){
          return console.log(err)           
        }
        const product = data[0]

        const sqlImg =`select * from img_source order by name asc`
        conexao.query(sqlImg, (err, data) =>{
            if(err){
              return  console.log(err)           
            }
            
            //Dados retornados da tabela img_source
            const source = data          

            res.render('editProduto', {product, source})
        })                    
        
    })
})


//Rota para actualizar os produtos
app.post('/update-product', checkAuth, (req, res) =>{
    const id = req.body.id
    const name = req.body.name
    const amount = req.body.amount
    const categoria = req.body.categoria
    const imagem = req.body.imagem

    const sqlQuery = `UPDATE products SET category_id= ?, img_id = ?,  name = ?, amount= ? WHERE id = ${id}`
    conexao.query(sqlQuery, [categoria, imagem, name, amount ], (err) =>{
        if(err){
            console.log(err)
            return
        }
        req.flash('message', 'Produto actualizado com sucesso')
       return res.redirect('/products')
    })
})  

//Rota para eliminar produtos
app.post('/delete/product', checkAuth, (req, res) =>{
    const id = req.body.id
    const sqlQuery = `DELETE FROM products WHERE id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        req.flash('message', 'Produto removido com sucesso')
        res.redirect('/products')
    })
})

//Rota para filtrar produtos
app.post('/filtro', checkAuth, (req, res) =>{
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
app.post('/listaCompras', checkAuth, (req, res) =>{
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
           //console.log(`Produto ja adicionado na lista de compras`)
            req.flash('message', 'Produto ja adicionado na lista de compras')
            return res.redirect('/listaCompras')
          
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
                //console.log(list)
                req.flash('message', 'Produto adicionado com sucesso')
               return res.render('listaCompras', {list})
            })
       
        })
        }

        
    })

   

})

//Rota para abrir a lista de compras
app.get('/listaCompras', checkAuth, (req, res) =>{
    const message = req.flash('message')[0] || null
   const sql = `SELECT product_id, name, done FROM lista_compras`
        conexao.query(sql, (err, data) =>{
            if(err){
                console.log(err)
                return
            }
            const list = data
            //console.log(list)
            res.render('listaCompras', {list, message})
        })
})

//Rota para actualizar a lista de compras
app.post('/updateStatus', checkAuth, (req, res)=>{
    const id = req.body.idp
    const done = req.body.done === '0' ? 1 : 0
       
    const sqlQuery = `UPDATE listCompras SET done =${done} WHERE product_id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        //console.log(id)
        res.redirect('/listaCompras')
    })  

})

//Rota para remover produto da lista de compras
app.post('/removerProduto', checkAuth, (req, res) =>{
    const id = req.body.idr

    const sqlQuery = `DELETE FROM listCompras WHERE product_id = ${id}`
    conexao.query(sqlQuery, (err) =>{
        if(err){
            console.log(err)
            return
        }
        req.flash('message', 'Produto removido com sucesso')
      return res.redirect('/listaCompras')
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
       // console.log(products)
       
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

