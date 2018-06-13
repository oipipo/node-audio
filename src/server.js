const 	express= require('express'),
		app = express(),
		server = require('http').Server(app),
		io = require('socket.io')(server),
		ss = require('socket.io-stream'),
		path = require('path'),
		fs = require('fs'),
		stream= ss.createStream();
		publicDir =express.static(path.join(__dirname,'public'));//definir ruta publica

//configurar las rutas
app.set('views', path.join(__dirname, 'views'));//para obtener las vistas
app.set('view engine','ejs');//modulo de plantilla

app.use(publicDir);

app.get('/server',(req,res)=>
{
	res.render("server",{});
});
app.get('/',(req, res)=>
{
	res.render("client",{});
});
server.listen(3000, ()=> {
	console.log('Servidor corriendo en http://localhost:3000'); 	
});	

io.on('connection', function(socket) 
{
	
	
	socket.emit("mensaje","conecto con el servidor");
	socket.on('mensaje', function(mensaje) 
	{
		io.emit("mensaje","cliente: "+mensaje);
	});

	socket.on('audio', function(arch,nombre)
	{
		fs.writeFile(path.join(__dirname,'public','audios', nombre), arch,  "binary",function(err)
		{
			if(err)
				console.log(err)
			else
				io.emit("audio",nombre);
		});
	})
});





