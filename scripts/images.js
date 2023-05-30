#!/usr/bin/env node

const fs = require("fs");
const { exec } = require("node:child_process");

const IMAGE_DIR = "./img";
const IMAGES_HTML_PATH = "./tmp/images.html";

const files = fs.readdirSync(IMAGE_DIR);
const html = [];

if (files.length > 0) {
  files
    .map((file) => {
      const { mtimeMs } = fs.statSync(`${IMAGE_DIR}/${file}`);
      return { file, mtimeMs };
    })
    .filter((file) => file.file.endsWith(".svg"))
    .sort((a, b) => {
      return b.mtimeMs - a.mtimeMs;
    })
    .forEach(({ file }) => {
      const name = file
        .replace(/_/, " &nbsp;&nbsp; <em>")
        .replace(/[_-]/g, " ")
        .replace(/\.png$/g, "</em>");

      html.push(`
        <h3>${name}</h3>
        <img src="../img/${file}">
      `,
      );
    });
} else {
  html.push("<h3>No images found</h3>");
}

fs.writeFileSync(IMAGES_HTML_PATH, `
  <html>
    <head>
      <title>Images</title>
      <style>
        body {
          font-family: sans-serif;
          margin: 0 0 20px;
          background-color: gainsboro;
          display: flex;
          align-items: center;
          flex-direction: column;
          color: darkgray;
        }
        h3 {
          margin: 30px 0 5px;
          color: dimgray;
        }
        em {
          color: darkgoldenrod;
        }
        img {
          margin-top: 10px;
          width: 50%;
          border: 1px solid gray;
        }
      </style>
    </head>
    <body>
      ${html.join("")}
    </body>
  </html>
`);

exec(`open ${IMAGES_HTML_PATH}`);
