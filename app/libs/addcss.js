/**
 * 创建 style 标记
 * @param rules
 * @returns {*}
 */

var doc = document;

function createStyle( rules ) {
    var tag  = doc.createElement( 'STYLE' );
    tag.type = 'text/css';
    if ( tag.styleSheet ) {
        tag.styleSheet.cssText = rules;
    } else {
        tag.innerHTML = rules;
    }
    return tag;
}

function addCSS(style) {
	(doc.head || doc.body).appendChild(createStyle(style));
}

module.exports = addCSS;