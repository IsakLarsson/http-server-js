const net = require("node:net");
const fs = require("node:fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const flags = process.argv.slice(2);

const supportedCompressions = new Set(["gzip"]);

function HTTPResponse() {
    let res = "HTTP/1.1";
    return {
        OK: function () {
            res += " 200 OK\r\n";
            return this;
        },
        created: function () {
            res += " 201 Created\r\n";
            return this;
        },
        notFound: function () {
            res += " 404 Not Found\r\n";
            return this;
        },
        notImplemented: function () {
            res += " 501 Not Implemented\r\n";
            return this;
        },
        withHeader: function (header, value) {
            res += `${header}: ${value}\r\n`;
            return this;
        },
        withContent: function (content) {
            res += `Content-Length: ${content.length}\r\n\r\n${content}`;
            return this;
        },
        make: () => `${res}\r\n`,
    };
}

function textResponse(content) {
    return HTTPResponse()
        .OK()
        .withHeader("Content-Type", "text/plain")
        .withContent(content)
        .make();
}

function textResponseWithCompression(content, compression) {
    return HTTPResponse()
        .OK()
        .withHeader("Content-Type", "text/plain")
        .withHeader("Content-Encoding", compression)
        .withContent(content)
        .make();
}

function fileResponse(fileBuffer) {
    return HTTPResponse()
        .OK()
        .withHeader("Content-Type", "application/octet-stream")
        .withContent(fileBuffer)
        .make();
}

function createdResponse(fileBuffer) {
    return HTTPResponse()
        .created()
        .withHeader("Content-Type", "application/octet-stream")
        .withContent(fileBuffer)
        .make();
}

function notFoundResponse() {
    return HTTPResponse().notFound().make();
}

function extractDirectory() {
    const directory = flags.find(
        (_, index) => flags[index - 1] === "--directory",
    );
    return directory;
}

function handleGET(url, headers) {
    const compressionHeader = headers.find((header) =>
        header.includes("Accept-Encoding"),
    );
    const compressions = compressionHeader
        ? compressionHeader.split(": ").slice(1)[0].split(", ")
        : [];

    const acceptedCompression = compressions.find((compression) =>
        supportedCompressions.has(compression),
    );

    if (url === "/") {
        return HTTPResponse().OK().make();
    }
    if (url.includes("/echo/")) {
        const content = url.split("/echo/")[1];
        if (acceptedCompression) {
            return textResponseWithCompression(content, acceptedCompression);
        }
        return textResponse(content);
    }
    if (url.includes("/user-agent")) {
        const userAgent = headers
            .find((header) => header.includes("User-Agent"))
            .split(": ")[1];
        return textResponse(userAgent);
    }
    if (url.includes("/files")) {
        const directory = extractDirectory();
        const fileName = url.split("/files/")[1];
        const filePath = directory.concat(fileName);
        if (fs.existsSync(filePath)) {
            const file = fs.readFileSync(filePath);
            return fileResponse(file);
        }
        return notFoundResponse();
    }
    return notFoundResponse();
}

function handlePOST(url, headers, body) {
    if (url.includes("/files")) {
        const directory = extractDirectory();
        const fileName = url.split("/files/")[1];
        const filePath = directory.concat(fileName);
        fs.writeFileSync(filePath, body);
        return createdResponse(body);
    }
    return notFoundResponse();
}

const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        const request = data.toString();
        const [headerPart, body] = request.split("\r\n\r\n");
        const [requestline, ...headers] = headerPart.split("\r\n");
        const [method, url] = requestline.split(" ");

        console.log(request);
        switch (method) {
            case "GET":
                socket.write(handleGET(url, headers));
                break;

            case "POST":
                socket.write(handlePOST(url, headers, body));
                break;

            default:
                socket.write(HTTPResponse().notImplemented().make());
                break;
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
