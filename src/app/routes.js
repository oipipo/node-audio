module.exports=(app)=>
{
    //routes
    app.get('/server',(req,res)=>
    {
        res.render("server",{});
    });
    app.get('/',(req, res)=>
    {
        res.render("client",{});
    });
}