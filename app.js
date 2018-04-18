var express = require('express'),
    user = require('./routes/user'),
    http = require('http'),
    bodyParser=require('body-parser'),
    cookieParser=require('cookie-parser')

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server,{log:false});
var clients = [];
var users = [];
app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/node_modules'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
io.sockets.on('connection',function(socket){
    console.log('a user connected');
    socket.on('online',function(data){
        //将上线的用户名存储为 socket 对象的属性，以区分每个 socket 对象，方便后面使用
        //socket.name = data.user;
        clients[socket.id]=data.user;
        //users 对象中不存在该用户名则插入该用户名

        if (!users.includes(data.user)) {
            users.push(data.user);
        }
        //向所有用户广播该用户上线信息
        io.sockets.emit('online', {users: users, user: data.user});
    });
    socket.on('say', function (data) {
        if (data.to == 'all') {
            //向其他所有用户广播该用户发话信息
            socket.broadcast.emit('say', data);
        } else {
            //向特定用户发送该用户发话信息
            //sockets返回所有连接的id
            var sockets= Object.keys(io.sockets.sockets);
            //遍历找到该用户
            console.log(JSON.stringify(sockets) + "    "+ io.sockets);
            for(var i in sockets) {
                var id=sockets[i];
                console.log(id+ ' '+clients[id]);
                //利用id为索引找到对应的用户名称
                if (clients[id] == data.to) {
                    //调用to方法向特定用户触发 say 事件
                    io.to(id).emit('say', data);

                }
            };
        }
    });
   /* socket.on('offline',function(user){
        socket.disconnect();
    });*/
    /*socket.on('disconnect',function(){
        //有人下线
        setTimeout(userOffline,5000);
        function userOffline()
        {
            for(var index in clients)
            {
                if(clients[index] == socket)
                {
                    users.splice(users.indexOf(index),1);
                    delete clients[index];
                    for(var index_inline in clients)
                    {
                        clients[index_inline].emit('system',JSON.stringify({type:'offline',msg:index,time:(new Date()).getTime()}));
                        clients[index_inline].emit('userflush',JSON.stringify({users:users}));
                    }
                    break;
                }
            }
        }
    });*/
});

app.get('/', function (req, res, next) {
    if (req.cookies.user == null) {
        res.redirect('/signin');
    } else {
        res.sendfile('views/index.html');
    }
});
app.get('/signin',function(req,res,next){
    res.sendfile('views/signin.html');
});
/*app.get('/signup',function(req,res,next){
    res.sendfile('views/signup.html');
});*/
app.post('/signin',function(req,res,next){
    if (users[req.body.name]) {
        //存在，则不允许登陆
        res.redirect('/signin');
    } else {
        //不存在，把用户名存入 cookie 并跳转到主页
        res.cookie("user", req.body.name, {maxAge: 1000*60*60*24*30});
        res.redirect('/');
    }
});
server.listen(3000, function(){
    console.log("Express server listening on port " + '3000');
});
