module.exports.checkAuth = function(req, res, next){
    const userid= req.session.userid

    if(!userid){
        req.flash('message', 'Faça login primeiro')
        res.redirect('/login')
        return        
    }

    next()
}