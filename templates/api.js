app.get("/search", async (req, res) => {
    const userQueryBookTitle = req.query.userQueryBookTitle;
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(userQueryBookTitle)}`;

    const response = await fetch(url);
    const data = await response.json();

    const results = [];
    let len;
    if (data.docs.length > 10) {
        len = 10;
    }
    else{
        len = data.docs.length;
    }
    for (let i = 0; i < len; i++) {
        let ebook_access;
        let author;
        let year;
        const book = data.docs[i];
        const title = book.title || "N/A";
        if (book.author_name) {
            author = book.author_name[0];
        }
        else{
            author = "N/A";
        }
        if(book.first_publish_year === undefined){
            year = "N/A";
        }
        else{
            year = book.first_publish_year;
        }
        if(book.ebook_access === undefined){
            ebook_access = "N/A";
        }
        else{
            ebook_access = book.ebook_access;
        }

        results.push({
            title: title,
            author: author,
            year: year,
            ebook_access: ebook_access
        });
    }

    res.json({ results });
});
