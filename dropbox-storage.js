function DropboxStorage () {
    var KEY = "<YOUR KEY>";
    var SECRET = "<YOUR SECRET>";

    var dropbox = new Dropbox(KEY, SECRET);

    this.connect = function (fn) {
        dropbox.authorize(function () { fn.apply(this, []); });
    };

    this.readDirectory = function (path, fn) {
        dropbox.getDirectoryContents(
            path.toString(),
            function (data, status, xhr) {
                var paths = [];
                $.each(data.contents, function () {
                    if (this.mime_type.match(/text\/plain/)) {
                        paths.push(this.path);
                    }
                });
                fn(paths);
            }
        );
    };

    this.readFile = function (path, fn) {
        dropbox.getFileContents(path, function (content) {
            fn(content);
        });
    };

    this.updateFile = function (path, content) {
        var onsuccess = function () {
            console.log('PUT COMPLETED');
        };
        dropbox.putFileContents(path, content, onsuccess);
    };
}
