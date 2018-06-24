const //requiero las dependencias
	express= require('express'),
	app = express(),
	path = require('path'),
	io = require('socket.io'),
	http = require('http'),
	https = require('https'),
	fs = require('fs'),
	publicDir =express.static(path.join(__dirname,'public'));//definir ruta publica
//settings
app.set('views', path.join(__dirname, 'views'));//para obtener las vistas
app.set('view engine','ejs');//modulo de plantilla

//middlewares
app.use(publicDir);//definir ruta publica
app.use((req, res, next)=>{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

require('./app/routes.js')(app);//configuro rutas

//configuro credenciales para https
const credentials = 
{
	key: fs.readFileSync(path.join(__dirname,'certificates','client-key.pem'),'utf8'),
	cert: fs.readFileSync(path.join(__dirname,'certificates','client-cert.pem'),'utf8'),
	dhparam: fs.readFileSync(path.join(__dirname,'certificates','dh-strong.pem'),'utf8'),
	requestCert: false,
	rejectUnauthorized: false
};
//creo los servidores http y https
const httpServer =http.createServer(app);
const httpsServer =https.createServer(credentials,app);
var LANAccess = "0.0.0.0"; //colocando acceso a todo
//los pongo a funcionar
httpServer.listen(3000,LANAccess,()=>{console.log('listen on http://localhost:3000')});
httpsServer.listen(3445,LANAccess,()=>{console.log('listen on https://localhost:3445')});
//creo el servidor peer
app.use('/peerjs',require('peer').ExpressPeerServer(httpsServer,{debug:true}));
app.use('/peerjs',require('peer').ExpressPeerServer(httpServer,{debug:true}));
//defino cada uno a los sockets
const httpio =io.listen(httpServer);
const httspio =io.listen(httpsServer);


httpio.on('connection', ioConnection);
httspio.on('connection', ioConnection);

function ioConnection(socket)
{
	socket.emit("mensaje","conecto con el servidor");
	socket.on('mensaje', function(mensaje) 
	{
		socket.emit("mensaje","cliente: "+mensaje);
	});

	socket.on('audio', function(arch,nombre)
	{
		fs.writeFile(path.join(__dirname,'public','audios', nombre), arch,  "binary",function(err)
		{
			if(err)
				console.log(err)
			else
			{
				socket.broadcast.emit("audio",nombre);
				socket.emit("audio",nombre);
			}
		});
	});
	socket.on('id', (id)=>
	{
		socket.broadcast.emit('id',id);
	});
	socket.on('endcall',(empty)=>
	{
		socket.broadcast.emit('endcall','');
	});
}
