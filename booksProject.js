const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

(async () => {
    const router = express.Router();
    const portNumber = process.argv[2] || 3000;
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(__dirname));


    try {
        await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
            dbName: "libraryDB",
        });
    } 
    catch (e) {
        process.exit(1);
    }

    const booksSchema = new mongoose.Schema({
        firstName: String,
        lastName: String,
        studentID: String,
        bookTitle: String,
    });
    const Book = mongoose.model("Book", booksSchema);

    app.get("/", (req, res) => {
        res.send(`
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="style.css">
            <title>Welcome</title>
        </head>
        <body>
            <header>
                <h1>Welcome to the Library App</h1>
            </header>

            <main>
                <p>Select an option below:</p>

                <form action="/bookForm" method="GET">
                    <div class="bookA"></div>
                    <div class="bookB"></div>
                    <button type="submit">Search Books</button>
                </form>

                <form action="/registerForBook" method="GET">
                    <div class="bookC"></div>
                    <div class="bookD"></div>
                    <button type="submit">Register Reader</button>  
                </form>

                <form action="/viewDatabase" method="GET">
                    <div class="bookE"></div>
                    <div class="bookF"></div>
                    <div class="bookG"></div>
                    <button type="submit">View Database of Readers</button>
                </form>

                <form action="/clearDatabase" method="GET">
                    <button type="submit">Clear Database</button>
                </form>

            </main>
        </body>
        </html>
    `);
    });

    app.get("/clearDatabase", (req, res) => {
        res.send(`
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="style.css">
            <title>Clear Database</title>
        </head>
        <body>
            <header>
                <h1>Clear All Readers in Database</h1>
            </header>
            <main>
                <form method="post" action="/clearDatabase">
                    <button type="submit">Delete All Readers</button><br>
                    
                </form><br>
                <a href="/">HOME</a>
            </main>

            <script>
                window.onsubmit = () => {
                    return confirm("Are you sure you want to delete the database?");
                };
            </script>
        </body>
        </html>
    `);
    });

    app.post("/clearDatabase", async (req, res) => {
        await Book.deleteMany({});

        res.send(`
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <link rel="stylesheet" href="style.css">
            <title>Database Cleared</title>
        </head>
        <body>
            <main>
                <h1><strong>Database Cleared</strong></h1>
                All entries have been removed.<br><br>
                <a href="/">HOME</a>
            </main>
        </body>
        </html>
    `);
    });

    router.get("/bookForm", (req, res) => {
        res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <link rel="stylesheet" href="style.css">
            <title>Search Books</title>
        </head>

        <body>
            <header>
                <h1>Search Books</h1>
            </header>

            <main>
                <form method="post" action="/searchBooks">
                    <h2>Book Search</h2>
                    Book Title:
                    <input type="text" name="title" placeholder="Enter a book title" required>
                    <br>
                    <button type="submit">Search</button><br>
                    <a href="/">Return</a>
                </form>
            </main>

        </body>
        </html>
    `);
    });

    router.post("/searchBooks", async (req, res) => {
        const userQueryBookTitle = req.body.title;
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(userQueryBookTitle)}`;

        const response = await fetch(url);
        const data = await response.json();
        const docs = data.docs;

        let len;
        if (docs.length > 10) {
            len = 10;
        } 
        else {
            len = docs.length;
        }

        let html = `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <link rel="stylesheet" href="style.css">
            <title>Search Results</title>
        </head>
        <body>
            <header>
                <h1>Top ${len} Results for "${userQueryBookTitle}"</h1>
            </header>
            <main>
        `;

        if (len === 0) {
            html += `<p>No results found.</p>`;
        } 
        else {
            html += `
            <table border="1">
                <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>First Publish Year</th>
                    <th>Ebook Access</th>
                </tr>
            `;

            for (let i = 0; i < len; i++) {
                const book = docs[i];
                let title, author, year, ebook_access;

                if (book.title === undefined || book.title === null) {
                    title = "N/A";
                } else {
                    title = book.title;
                }

                if (book.author_name && book.author_name.length > 0) {
                    author = book.author_name[0];
                } else {
                    author = "N/A";
                }

                if (book.first_publish_year === undefined || book.first_publish_year === null) {
                    year = "N/A";
                } else {
                    year = book.first_publish_year;
                }

                if (book.ebook_access === undefined || book.ebook_access === null) {
                    ebook_access = "N/A";
                } else {
                    ebook_access = book.ebook_access;
                }

                html += `
                    <tr>
                        <td>${title}</td>
                        <td>${author}</td>
                        <td>${year}</td>
                        <td>${ebook_access}</td>
                    </tr>
                `;
            }

            html += `</table>`;
        }

        html += `
            <br>
            <a href="/bookForm">New Search</a><br>
            <a href="/">HOME</a>
            </main>
        </body>
        </html>`;

        res.send(html);
        
    });


    router.get("/registerForBook", (req, res) => {
        res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <link rel="stylesheet" href="style.css">
            <title>Register For A Book</title>
        </head>

        <body>
            <header>
                <h1>Register For A Book</h1>
            </header>

            <main>
                <form method="post" action="/registerForBook">
                    <h2>Book Registration</h2>

                    First Name:
                    <input type="text" name="firstName" placeholder="Enter your first name" required><br>
                    Last Name:
                    <input type="text" name="lastName" placeholder="Enter your last name" required>
                    <br>

                    Student ID:
                    <input type="text" name="studentID" placeholder="Enter your student ID" required>
                    <br>

                    Book You Want to Buy:
                    <input type="text" name="title" placeholder="Enter a book title" required>
                    <br>

                    <button type="submit">Register</button><br>
                    <a href="/">Return</a>
                </form>
            </main>

        </body>
        </html>
    `);
    });

    router.post("/registerForBook", async (req, res) => {
        const application = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            studentID: req.body.studentID,
            bookTitle: req.body.title
        };

        await Book.create(application);

        res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <link rel="stylesheet" href="style.css">
            <title>Registration Saved</title>
        </head>
        <body>
            <header>
                <h1>Registration Saved</h1>
            </header>
            <main>
                <p><strong>First Name:</strong> ${application.firstName}</p>
                <p><strong>Last Name:</strong> ${application.lastName}</p>
                <p><strong>Student ID:</strong> ${application.studentID}</p>
                <p><strong>Requested Book:</strong> ${application.bookTitle}</p>

                <br>
                <a href="/viewDatabase">View All Registrations</a><br>
                <a href="/registerForBook">Register Another Person</a><br>
                <a href="/">HOME</a>
            </main>
        </body>
        </html>
    `);
    });

    router.get("/viewDatabase", async (req, res) => {
        const allApplications = await Book.find({});
        let html = `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <link rel="stylesheet" href="style.css">
            <title>Registered Students</title>
        </head>
        <body>
            <header>
                <h1>Registered Students and Their Books</h1>
            </header>
            <main>
        `;

        if (allApplications.length === 0) {
            html += `No registrations yet.`;
        } 
        else {
            html += `<table border="1"><tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Student ID</th>
                <th>Requested Book</th></tr>`;
            allApplications.forEach(app => {
                html += `
                <tr>
                    <td>${app.firstName}</td>
                    <td>${app.lastName}</td>
                    <td>${app.studentID}</td>
                    <td>${app.bookTitle}</td>
                </tr>
                `;
            });

            html += `</table>`;
        }

        html += `
            <br>
            <a href="/registerForBook">Register Another Person</a><br>
            <a href="/">HOME</a>
            </main>
        </body>
        </html>
        `;

        res.send(html);
    });

    app.use("/", router);

    app.listen(portNumber, () => {
        console.log(`Server running on port ${portNumber}`);
    });
})();