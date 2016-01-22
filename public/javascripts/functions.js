$(document).ready(function() {
    // add the responsive image class to all images
    $('img').each(function() {
        $(this).addClass("img-responsive")
    });

    //setup mermaid charting
    mermaid.initialize({
        startOnLoad: true
    });

    // add the table class to all tables
    $('table').each(function() {
        $(this).addClass("table table-hover")
    });

    $(".alert-dismissable").fadeTo(2500, 800).slideUp(800, function() {
        $(".alert-dismissable").alert('close');
    });

    $("[class='published_state']").bootstrapSwitch();
    $("#frm_kb_published").bootstrapSwitch();
    $("input[class='published_state']").on('switchChange.bootstrapSwitch', function(event, state) {
        $.ajax({
                method: "POST",
                url: "/published_state",
                data: {
                    id: this.id,
                    state: state
                }
            })
            .done(function(msg) {
                alert("Data Saved: " + msg);
            });
    });

    var $preview, editor, mobileToolbar, toolbar;
    // Simditor.locale = 'en-US';
    toolbar = ['title', 'bold', 'italic', 'underline', 'strikethrough', 'fontScale', 'color', '|', 'ol', 'ul', 'blockquote', 'code', 'table', '|', 'link', 'image', 'hr', '|', 'indent', 'outdent', 'alignment'];
    // mobileToolbar = ["bold", "underline", "strikethrough", "color", "ul", "ol"];
    // if (mobilecheck()) {
    //   toolbar = mobileToolbar;
    // }
    editor = new Simditor({
        textarea: $('#editor'),
        placeholder: '这里输入文章内容...',
        toolbar: toolbar,
        pasteImage: true,
        defaultImage: 'assets/images/image.png',
        upload: {
            url: '/upload'
        }
    });
    // $preview = $('#preview');
    // if ($preview.length > 0) {
    //     return editor.on('valuechanged', function(e) {
    //         return $preview.html(editor.getValue());
    //     });
    // }

});

function file_delete_confirm(img, id) {
    if (window.confirm("Are you sure you want to delete the file?")) {
        $.ajax({
                method: "POST",
                url: "/file/delete",
                data: {
                    img: img
                }
            })
            .done(function(msg) {
                if (msg.data == "error") {
                    alert("File delete error. Try again.")
                } else {
                    console.log("here");
                    $("#file-" + id).remove();
                }
            });
    }
}

$(function() {
    $("input,select,textarea").not("[type=submit]").jqBootstrapValidation();
});

function search_form(id) {
    $('form#' + id).submit();
}
