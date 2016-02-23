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

    if($("#editor").length>=1){
        var editor, toolbar;
        toolbar = ['title', 'bold', 'italic', 'underline', 'strikethrough',
            'fontScale', 'color', '|', 'ol', 'ul', 'blockquote', 'code', 'table',
            '|', 'link', 'image', 'hr', '|', 'indent', 'outdent', 'alignment'
        ];
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
    }else if($("#disEditor").length>=1){
        var disEditor, disToolbar;
        disToolbar = ['title', 'bold', 'italic', 'underline', 'strikethrough',
            'fontScale', 'color', '|', 'ol', 'ul', 'blockquote', 'code',
            'table', '|', 'link', 'image', 'hr', '|', 'indent', 'outdent',
            'alignment'
        ];
        disEditor = new Simditor({
            textarea: $('#disEditor'),
            placeholder: '这里输入评论内容...',
            toolbar: disToolbar,
            pasteImage: true,
            defaultImage: 'assets/images/image.png',
            upload: {
                url: '/upload'
            }
        });
    }
    

    // 获取文章分类
    var _window_href = window.location.href;
    if( /categories/.test(_window_href)) {
        $.ajax({
            type: 'get',
            url: '/getCategories',
            dataType: 'JSONP',
            success: function(results){
                var html = '';
                for (var i = 0; i < results.length; i++) {
                    html += '<li id="'+results[i].id+'" data-level="2">' + results[i].text + '<ul>';
                    for (var j = 0; j < results[i].nodes.length; j++) {
                        html += '<li id="'+results[i].nodes[j].id+'" data-level="3">'+results[i].nodes[j].text+'</li>';
                    };
                    html += '</ul></li>';
                };
                $('.firstCat').append(html);
                $('.categoriesWrap li').click(function(){
                    var this_value = $(this).text();
                    var this_id = $(this).attr('id');
                    var this_level = $(this).attr('data-level');
                    $("#chosedCats").text(this_value);
                    $("#pcat_name").val(this_value);
                    $("#cat_pid").val(this_id);
                    $("#cat_level").val(this_level);
                    event.stopPropagation();
                });
                $('#tree').treeview({data: results});
            },
            error: function(data){
                // console.log(data.responseText);
            }
        })
    }

    var isRoot = false;
    $('#isFatherCat').click(function(){
        if($(this).is(':checked')){
            $('.categoriesWrap').hide();
            $("#cat_level").val(1);
            isRoot = true;
        }else{
            $('.categoriesWrap').show();
        }
    });

    $("#addCategoryBtn").click(function(event){
        var val1 = $('#cat_name').val();
        var val2 = $('#cat_pid').val();
        var val3 = $('#cat_level').val();
        if(isRoot){
            if(val1 == ''){
                event.preventDefault();
            }
        }else{
            if(val1 == '' || val2 == '' || val3 == ''){
                event.preventDefault();
            }
        }
    })

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
