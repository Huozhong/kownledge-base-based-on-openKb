/* bootstrapTagger
 *
 * License: MIT <http://opensource.org/licenses/mit-license.php> - see LICENSE file
 *
 * github.com/mrvautin/bootstrapTagger
 */
! function(a) {
    a.fn.bootstrapTagger = function(r) {
        function t(r) {
        	// var r_array = r.trim().split(' ');
        	// console.log(r_array);
        	// for (var i = 0; i < r_array.length; i++) {
        		
         //    	a(p).before("<span class='bootstraptagger_word label label-" + o() + "'>" + r_array[i] + "<span class='bootstraptagger_remove'><a href='#'><i class='fa fa-times'></i></a></span></span>"), l.push(r), a(p).outerWidth(e(p)), n(u, l)
        	// };
            	a(p).before("<span class='bootstraptagger_word label label-" + o() + "'>" + r + "<span class='bootstraptagger_remove'><a href='#'><i class='fa fa-times'></i></a></span></span>"), l.push(r), a(p).outerWidth(e(p)), n(u, l)
        }

        function n(r) {
            a(r).val(l.join())
        }

        function o() {
            return "random" == s.backgroundColor ? i[Math.floor(Math.random() * i.length)] : s.backgroundColor
        }

        function e(r) {
            var t = a(r).parent().innerWidth(),
                n = 0;
            a(r).parent().children("span").each(function() {
                n = n + a(this).outerWidth() + 10
            });
            var o = t - n;
            return o - 10
        }
        var i = ["default", "primary", "success", "info", "warning", "danger"],
            s = a.extend({
                backgroundColor: "primary"
            }, r);
        "random" != s.backgroundColor && -1 == i.indexOf(s.backgroundColor) && (s.backgroundColor = "primary");
        var p = this,
            l = [],
            c = a(p).attr("id"),
            d = a(p).attr("name");
        a(p).wrap("<div class='bootstraptagger_wrapper'></div>"), a(p).attr("id", "bootstraptagger_input_field"), a(p).parent().append("<input type='hidden' name='" + d + "' id='" + c + "'>");
        var u = a("#" + c);
        if (a(p).addClass("bootstraptagger_input_box"), a(p).outerWidth(e(p)), a(p).removeClass("form-control"), a(p).val()) {
            var f = a(p).val().split(",");
            a.each(f, function(a, r) {
                t(r)
            }), n(u, l), a(p).val("")
        }
        a(p).keydown(function(r) {
            if ((8 == r.which || 46 == r.which) && "" == a(p).val()) {
                var t = a(p).parent().children("span").last().text();
                l.splice(l.indexOf(t), 1), a(p).parent().children("span").last().remove(), n(u, l)
            }
        }), a(p).keyup(function(r) {
            if (188 == r.which) {
                var n = a(p).val().split(",");
                "" != n[0] && -1 == l.indexOf(n[0]) && t(n[0]), a(p).val("")
            }
        }), a(document).on("click", ".bootstraptagger_remove", function() {
            var r = a(this).parent().text().trim();
            l.splice(l.indexOf(r), 1), a(this).parent().remove(), n(u, l)
        })
    }
}(jQuery);
