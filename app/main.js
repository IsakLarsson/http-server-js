const net = require("node:net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function textResponse(content) {
    return `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
}

function notFoundResponse() {
    return "HTTP/1.1 404 Not Found\r\n\r\n";
}

const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });
    socket.on("data", (data) => {
        const url = data.toString().split(" ")[1];
        if (url === "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else if (url.includes("/echo/", 0)) {
            const content = url.split("/echo/")[1];
            socket.write(textResponse(content));
        } else if (url.includes("/user-agent")) {
            const userAgent = data.toString().split("User-Agent: ")[1].trim();
            socket.write(textResponse(userAgent));
        } else {
            socket.write(notFoundResponse());
        }
    });
});

server.listen(4221, "localhost");
