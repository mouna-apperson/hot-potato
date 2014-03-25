var LISTEN_PORT = 1407;
var net = require('net');
var LOCAL_NETWORK_PREFIX = '192.168.88.';

// allow one connection for each machine on the same local network 192.168.88.x
var connections_by_octet = (function(){
  var rv = [];
  for(var i = 0; i !== 256; ++i) rv.push(null);
  return rv;
})();

// function for sending the potato to a random peer
var passee_octet_iterator = Math.floor(Math.random() * 256);
function pass_the_potato(potato){
  var data = new Buffer(JSON.stringify(potato), 'utf8');
  for(var i = 1; i !== 257; ++i){
    var attempted_octet = (passee_octet_iterator + i) & 0xFF;
    if(connections_by_octet[attempted_octet]){
      // we found a socket to pass to
      console.log('POTATO PASSED');
      passee_octet_iterator = attempted_octet;
      connections_by_octet[attempted_octet].write(data);
      return;
    }
  }

  // no one to pass to ...
  console.log('UNABLE TO FIND ANYONE TO PASS THE POTATO TO :-(');
  console.log('POTATO DROPPED');
}

// helper to initialize a socket connection
function init_socket(socket){
  var data = new Buffer(0);
  var timeout = null;

  // figure out the octet we are receiving this connection from
  var octet = parseInt(socket.remoteAddress.split('.')[3], 10);
  console.log('Connection established to host ' + LOCAL_NETWORK_PREFIX + octet);

  function pass_potato(){
    data = data.toString();
    console.log('PASSING POTATO FROM ' + octet + ':', data);
    data.replace('/ oonst/g', '');
    data.replace('/ new tater/g', '');
    var potato = {
      fixed_by: 'Nick',
      via: ['Nick']
    };
    try {
      potato = JSON.parse(data);
      if(!potato.via) potato.via = ['Nick'];
      else potato.via.push('Nick');

      if(potato.beer){
        var m = potato.beer.parseInt(10);
        var bottles_of_beer = m[1];
        if(bottles_of_beer > 50) potato.beer = (bottles_of_beer) + " Bottles of beer on the wall " + (bottles_of_beer) + " bottles of beer, take 50 down and get really drunk, " + (bottles_of_beer - 50) + " bottles of beer on the wall";
        else if(bottles_of_beer === 1) potato.beer = "NO MORE BEER!";
        else potato.beer = (bottles_of_beer) + " Bottles of beer on the wall " + (bottles_of_beer) + " bottles of beer, take one down and pass it around, " + (bottles_of_beer - 1) + " bottles of beer on the wall";
      }
      else {
        potato.beer = "10 Bottles of beer on the wall 10 bottles of beer, take one down and pass it around, 9 bottles of beer on the wall";
      }
    }
    catch(e){
    }
    pass_the_potato(potato);
    data = new Buffer(0);
    timeout = null;
  }

  function on_data(new_data){
    data = Buffer.concat([data, new_data]);
    if(timeout) clearTimeout(timeout);
    timeout = setTimeout(pass_potato, 20);
  }

  function on_close(){
    socket.destroy();
    if(connections_by_octet[octet] === socket){
      console.log('Connection to host ' + LOCAL_NETWORK_PREFIX + octet + ' lost');
      connections_by_octet[octet] = null;
    }
  }

  if(connections_by_octet[octet]){
    // if we already have a connection to that host, close this connection
    socket.destroy();
  }
  else {
    connections_by_octet[octet] = socket;
    socket.on('end', on_close);
    socket.on('close', on_close);
    socket.on('error', on_close);
    socket.on('data', on_data);
  }
}

function init_socket_this(){
  init_socket(this);
}

// listen for connections
net.createServer(init_socket).listen(LISTEN_PORT, function() {
  console.log('Server listening on port ' + LISTEN_PORT);
});

// create connections
function create_missing_connections(){
  for(var octet = 1; octet !== 255; ++octet){
    if(octet === 96) continue;
    if(!connections_by_octet[octet]){
      net.createConnection(LISTEN_PORT, LOCAL_NETWORK_PREFIX + octet, init_socket_this).on('error', function(){});
    }
  }
}

create_missing_connections();
setInterval(create_missing_connections, 45000);

setTimeout(function(){
  pass_the_potato({from: 'Nick', packet_id: Math.floor(Math.random() * 100000000)});
}, 1000);

