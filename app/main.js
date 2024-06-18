const net = require("node:net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
        server.close();
    });
    socket.on("data", (data) => {
        const url = data.toString().split(" ")[1];
        if (url === "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else if (url.includes("/echo/", 0)) {
            const content = url.split("/echo/")[1];
            console.log(content);
            socket.write(
                `HTTP/1.1 200 OK\r\n\r\nContent-Type: text/plain\r\n\r\nContent-Length: ${content.length}\r\n\r\n${content}`,
            );
        } else {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
    });
});

server.listen(4221, "localhost");
