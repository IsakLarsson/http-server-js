const net = require("node:net");
const fs = require("node:fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const flags = process.argv.slice(2);

console.log(flags);

function res() {
    let response = "HTTP/1.1";
    return {
        OK: function () {
            response += " 200 OK\r\n";
            return this;
        },
        notFound: function () {
            response += " 404 Not Found\r\n";
            return this;
        },
        withHeader: function (header) {
            response += `${header}\r\n`;
            return this;
        },
        withContent: function (content) {
            response += `Content-Length: ${content.length}\r\n\r\n${content}`;
            return this;
        },
        make: () => `${response}\r\n`,
    };
}

function textResponse(content) {
    return res()
        .OK()
        .withHeader("Content-Type: text/plain")
        .withContent(content)
        .make();
}

function fileResponse(fileBuffer) {
    return res()
        .OK()
        .withHeader("Content-Type: application/octet-stream")
        .withContent(fileBuffer)
        .make();
}

function notFoundResponse() {
    return res().notFound().make();
}

function extractDirectory() {
    const directory = flags.find(
        (_, index) => flags[index - 1] === "--directory",
    );
    return directory;
}

const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        const request = data.toString();
        const url = request.split(" ")[1];
        const headers = request.split("\r\n");
        console.log(request);

        if (url === "/") {
            socket.write(res().OK().make());
        } else if (url.includes("/echo/")) {
            const content = url.split("/echo/")[1];
            socket.write(textResponse(content));
        } else if (url.includes("/user-agent")) {
            const userAgent = headers[2].split("User-Agent: ")[1];
            socket.write(textResponse(userAgent));
        } else if (url.includes("/files")) {
            const directory = extractDirectory();
            const fileName = url.split("/files/")[1];
            const filePath = directory.concat(fileName);
            if (fs.existsSync(filePath)) {
                const file = fs.readFileSync(filePath);
                socket.write(fileResponse(file));
            } else {
                socket.write(notFoundResponse());
            }
        } else {
            socket.write(notFoundResponse());
        }
    });
    socket.on("error", (error) => {
        console.error(error);
    });
    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
