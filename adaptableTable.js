/**
 * Created by cguegan on 05/04/2016.
 */
;
(function ($) {

    $.fn.extend({
        // retrieve the scrollbar width, even if some style are applied on it
        getScrollBarWidth: function () {
            var cmpWidth = 100; // faked width to force the scrolling
            var $scrollOuter = $('<div>').css({
                    visibility: 'hidden',
                    width: cmpWidth,
                    overflow: 'scroll'
                }).appendTo('body'),
                widthWithScroll = $('<div>').css({width: '100%'}).appendTo($scrollOuter).outerWidth();
            $scrollOuter.remove();
            return cmpWidth - widthWithScroll;
        },
        // retrieve the scrollbar height, even if some style are applied on it
        getScrollBarHeight: function () {
            var cmpHeight = 100; // faked height to force the scrolling
            var $scrollOuter = $('<div>').css({
                    visibility: 'hidden',
                    height: cmpHeight,
                    overflow: 'scroll'
                }).appendTo('body'),
                widthHeightScroll = $('<div>').css({height: '100%'}).appendTo($scrollOuter).outerHeight();
            $scrollOuter.remove();
            return cmpHeight - widthHeightScroll;
        },
        // check if scroll bars are displayed for a specific container (usage: $elem.hasScrollBars())
        hasScrollBar: function () {
            var hasScrollBar = {}, e = this.get(0);
            hasScrollBar.horizontal = !!(e.scrollWidth > e.clientWidth);
            hasScrollBar.vertical = !!(e.scrollHeight > e.clientHeight);
            return hasScrollBar;
        },
        // check if an inline style is applied to the element
        inlineStyle: function (prop) {
            return this.prop('style')[$.camelCase(prop)];
        },
        // check if a jquery object has a specific attribute (usage: $elem.hasAttr())
        hasAttr: function (attr) {
            return (typeof attr !== typeof undefined && !!attr);
        },
        // main function to freeze rows and columns of a (or some) table(s) (usage: $table.adaptable())
        adaptable: function (options) {
            var defaults = {// default options of the plugin
                nbFixedRows: 1, // the number of rows to freeze (default: 1)
                nbFixedCols: 1, // the number of columns to freeze (default: 1)
                useFixedClasses: {// specify if the plugin base the constuction of frozen rows and columns from a "fixed" class
                    rows: false, // if set to true, the plugin search for tr tags which contains a class named "fixed". If found and it belongs to the first rows of the table, the row is frozen (default: false)
                    cols: false // if set to true, the plugin search for col tags which contains a class named "fixed". If found and it belongs to the first columns of the table, the column is frozen (default: false)
                },
                adaptableSize: true
            };
            // the user can override the default oprions
            var settings = $.fn.extend(true, {}, defaults, options);
            var id = {// html tag ids used by the plugin
                wrapper: 'adaptTableWrapper', // id of the main (highest level) container
                table: 'adaptTable', // prefix of the plugin elements
                suffix: {// suffixes of the plugin elements
                    wrapper: 'Wrapper', // suffix of the containers
                    headers: 'Headers', // suffix of the frozen rows main container
                    rows: 'Rows', // suffix for scrollable rows main container
                    fixedRoot: 'fixedRoot', // suffix of the top-left container that contains both frozen rows and frozen columns
                    fixedHeaders: 'FixedHeaders', // suffix of the top-right container that contains the frozen rows for the scrollable columns
                    fixedCols: 'FixedCols', // suffix of the bottom-left container that contains the frozen columns for the scrollable rows
                    cells: 'Cells', // suffix for the bottom-right container that contains both scrollable rows and scrollable columns
                    scrollFix: 'ScrollFix'// suffix for the div tag added to fix the vertical scrolling for the container that contains the frozen columns for the scrollable rows
                }
            };
            var attr = {// html tag attributes used by the plugin
                id: 'id',
                name: 'name',
                width: 'width',
                height: 'height',
                colspan: 'colspan'
            };
            var css = {// list of css attributes used by the plugin
                width: 'width',
                height: 'height',
                minWidth: 'min-width',
                minHeight: 'min-height',
                maxWidth: 'max-width',
                maxHeight: 'max-height',
                floatPos: 'float',
                position: 'position',
                overflow: 'overflow',
                lineHeight: 'line-height',
                marginLeft: 'margin-left',
                marginTop: 'margin-top',
                marginRight: 'margin-right',
                marginBottom: 'margin-bottom',
                paddingLeft: 'padding-left',
                paddingTop: 'padding-top',
                paddingRight: 'padding-right',
                paddingBottom: 'padding-bottom',
                visibility: 'visibility',
                border: 'border',
                zIndex: 'z-index'
            };
            var cl = {//list of css classes used by the plugin
                adaptableTable: 'adaptableTable', // class used by the the clones of the source table
                adaptableTableHidden: 'adaptableTableHidden', // class used by the cells added by the plugin to fix the horizontal scrolling for the container that contains the frozen rows for the scrollable columns
                fixed: 'fixed', // class used to identify the frozen columns (col tags) and the frozen rows (th or td tags)
                scrollable: 'scrollable', // class used to identify the scrollable containers
            };
            var str = {
                space: '&nbsp;'
            };
            var pos = {// position (top and left attributes) of the main (highest level) container
                top: 0,
                left: 0
            };
            var evt = {// list of the jQuery events used by the plugin
                scroll: 'scroll',
                resize: 'resize',
                syncTablePanels: function (e) {// event used to synchronize the scrolling of the containers
                    var $target = $(e.target);
                    if ($target.attr(attr.id) === id.table + id.suffix.cells) { // the user scrolls from the container that contains both the scrollable rows and the scrollable columns
                        elem.tableFixedColsDiv().scrollTop($target.scrollTop()); // vertical scrolling synchro of the container that contains the frozen columns for the scrollable rows
                        elem.tableFixedHeadersDiv().scrollLeft($target.scrollLeft()); // horizontal scrolling synchro of the container that contains the frozen rows for the scrollable columns
                    }
                    else if ($target.attr(attr.id) === id.table + id.suffix.fixedCols) { // the user scrolls from the container that contains the frozen columns for the scrollable rows
                        elem.tableCellsDiv().scrollTop($target.scrollTop()); // vertical scrolling synchro for the container that contains both the scrollable rows and the scrollable columns
                    }
                    else if ($target.attr(attr.id) === id.table + id.suffix.fixedHeaders) {
                        elem.tableCellsDiv().scrollLeft($target.scrollLeft()); // horizontal scrolling synchro for the container that contains both the scrollable rows and the scrollable columns
                    }

                    e.stopPropagation(); // used to prevent overriding of the current scrolling position
                    return false;
                }
            };
            var elem = {// proxy methods to select the plugin specific elements
                html: function () {
                    return $('html');
                },
                body: function () {
                    return $('body');
                },
                wrapper: function () {// proxy method to select the main (highest level) container
                    return $('#' + id.wrapper);
                },
                tableFixedHeadersDiv: function () {// proxy methods to select the frozen rows main container
                    return $('#' + id.table + id.suffix.fixedHeaders);
                },
                tableFixedColsDiv: function () {// proxy methods to select the container that contains the frozen columns for the scrollable rows
                    return $('#' + id.table + id.suffix.fixedCols);
                },
                tableCellsDiv: function () {// proxy methods to select the container that contains both scrollable rows and scrollable columns
                    return $('#' + id.table + id.suffix.cells);
                }
            };
            var methods = {// methods used by the plugin
                saveParentsDimensions: function (parents) { // save on inline styles the dimensions of the containers that contain the source table, including the document and the body, in order to adapt the dimensions of the adaptable table
                    // parents must an array containing all the parents of the source table, reverted in order to start from the largest to the smallest
                    $(parents).each(function () {
                        methods.__saveDimensions($(this)); // save the dimensions of the current container, including the document and the body
                    });
                },
                adjustDims: function () // adjusts the dimensions of the main (highest level) container and the sub containers depending of the viewport (makes the plugin responsive)
                {
                    var wrapper = elem.wrapper();
                    if (wrapper.length > 0) {
                        var $tableFixedColsDiv = elem.tableFixedColsDiv();
                        var $tableFixedHeadersDiv = elem.tableFixedHeadersDiv();
                        var $tableCellsDiv = elem.tableCellsDiv();
                        var windowHeight = $(window).outerHeight(true);
                        var windowWidth = $(window).outerWidth(true);
                        var scrollTop = $(window).scrollTop();
                        var scrollLeft = $(window).scrollLeft();
                        var wrapperHeight = windowHeight;
                        var wrapperWidth = windowWidth;
                        var containerHeight = 99999;
                        var containerWidth = 99999;
                        var marginBottom = 0;
                        var paddingBottom = 0;
                        var marginRight = 0;
                        var paddingRight = 0;
                        pos.top = wrapper.offset().top; // Get the top position of the main container
                        pos.left = wrapper.offset().left; // Get the left position of the main container

                        if(elem.body().css(css.overflow) != 'hidden') {
                            windowHeight = windowHeight - $.fn.getScrollBarHeight();
                            windowWidth = windowWidth - $.fn.getScrollBarWidth();
                        }

                        wrapper.parents().each(function () {
                            var $this = $(this);
                            var cmpHeightVal = 0;
                            var cmpWidthVal = 0;
                            var $outer = $(divTag);
                            $outer.attr('id', $this.attr('id')).attr('class', $this.attr('class')).attr('style', $this.attr('style')).css({visibility: 'hidden', overflow: 'hidden'}).appendTo(elem.body());
                            marginBottom += parseInt($this.css(css.marginBottom));
                            paddingBottom += parseInt($this.css(css.paddingBottom));
                            if (elem.body().css(css.overflow) != 'hidden') {
                                marginRight += parseInt($this.css(css.marginRight));
                                paddingRight += parseInt($this.css(css.paddingRight));
                            }
                            cmpHeightVal = parseInt($outer.css(css.minHeight));
                            cmpWidthVal = parseInt($outer.css(css.minWidth));

                            if ($outer.height() > cmpHeightVal) {
                                containerHeight = Math.min(containerHeight, $outer.height());
                            }

                            if ($outer.width() > cmpWidthVal) {
                                containerWidth = Math.min(containerWidth, $outer.width());
                            }
                            $outer.remove();
                        });

                        wrapperHeight = Math.min((containerHeight - $.fn.getScrollBarHeight()), windowHeight + scrollTop - pos.top - marginBottom - paddingBottom);
                        wrapperWidth = Math.min((containerWidth - $.fn.getScrollBarWidth()), windowWidth + scrollLeft - pos.left - marginRight - paddingRight);
                        wrapper.css(css.overflow, 'hidden');
                        wrapper.height(wrapperHeight); // adapt the size of jQuerySheet to the height of the screen
                        wrapper.css(css.height, (wrapperHeight) + 'px'); // add a css height attribute for security

                        $tableFixedColsDiv.css(css.height, wrapper.get(0).clientHeight - fixedRowHeadersHeight); // change the height of the container that contains the frozen columns for the scrollable rows
                        if ($tableFixedColsDiv.length > 0) {
                            $tableCellsDiv.css(css.height, $tableFixedColsDiv.get(0).clientHeight); // adapt the height of the container that contains both scrollable rows and scrollable columns with the height of the bottom-left container
                        }

                        wrapper.width(wrapperWidth); // adapt the size of jQuerySheet to the width of the screen
                        wrapper.css(css.width, (wrapperWidth) + 'px'); // add a css width attribute for security

                        $tableFixedHeadersDiv.css(css.width, wrapper.get(0).clientWidth - fixedColsWidth); // change the width of the container that contains the frozen rows for the scrollable columns
                        if ($tableFixedHeadersDiv.length > 0) {
                            $tableCellsDiv.css(css.width, $tableFixedHeadersDiv.get(0).clientWidth); // adapt the width of the container that contains both scrollable rows and scrollable columns with the width of the top-right container
                        }
                    }
                },
                addMissingColumns: function () { // add columns (col tags) dynamically to ensure the synchronisation of the columns widths between the clones of the source table
                    var me = $(this);
                    var columnsTag = '<colgroup />';
                    var colTag = '<col />';
                    var $colgroup = me.find('colgroup');
                    var prevWidth, cssWidth, w = 0;
                    if ($colgroup.length <= 0) { // if no colgroup tag is defined, we have to create it, and add it as the first tag of the source table
                        $colgroup = $(columnsTag);
                        me.prepend($colgroup);
                    }

                    nbCols = me.getNbCols(); // we retrieve the real number of columns from the structure of the source table

                    for (i = 0; i < nbCols; i++) {
                        var $col = $colgroup.find('col:nth-child(' + (i + 1) + ')'); // we retrieve the col tag corresponding to the current column index

                        if (!settings.useFixedClasses.cols) { // if the frozen columns are not generated from the html code, we have to clean it by removing the fixed class
                            $col.removeClass('fixed');
                        }

                        if ($col.length <= 0) { // in case there is no col tag corresponding  to the current column index, we have to create a new one
                            var $tds = me.find('tr:first').find('th:nth-child(' + (i + 1) + '), td:nth-child(' + (i + 1) + ')'); // we retrieve the cell in the first row corresponding to the column index

                            if ($tds.length > 0) {
                                cssWidth = parseInt($tds.get(0).style.width, 10);
                            }

                            w = $tds.width();
                            w = Math.max(isNaN(cssWidth) ? 0 : cssWidth, isNaN(w) ? prevWidth : w); // we take the max value from the calculated width of the cell, and the width defined by css
                            $col = $(colTag).attr('width', w + 'px'); // we adjust the width of the col tag, regarding the width of the coresponding cell in the first row. In case no width can be calculated, we retrieve the one from the previous col tag
                            $colgroup.append($col); // we add the col tag at the end of the colgroup
                        }

                        if (!settings.useFixedClasses.cols && i < settings.nbFixedCols) { // if the frozen columns are not generated from the html code, and the column has to be frozen, we had the fixed css attribute to the col tag
                            $col.addClass('fixed');
                        }

                        prevWidth = w; // we save the width for the next col tag
                    }
                },
                isFixedRootTable: function () { // proxy method to check if the current clone of the source table is the one that contains both frozen columns and frozen rows (top-left clone)
                    var me = $(this);
                    bresult = false;
                    if (me.is('table')) {
                        bresult = (me.attr(attr.id) == id.table + id.suffix.fixedRoot);
                    }

                    return bresult;
                },
                isFixedColsTable: function () { // proxy method to check if the current clone of the source table is the one that contains the frozen columns for the scrollable rows (bottom-left clone)
                    var me = $(this);
                    bresult = false;
                    if (me.is('table')) {
                        bresult = (me.attr(attr.id) == id.table + id.suffix.fixedCols);
                    }

                    return bresult;
                },
                isFixedHeadersTable: function () { // proxy method to check if the current clone of the source table is the one that contains the frozen rows for the scrollable columns (top-right clone)
                    var me = $(this);
                    bresult = false;
                    if (me.is('table')) {
                        return (me.attr(attr.id) == id.table + id.suffix.fixedHeaders);
                    }

                    return bresult;
                },
                isCellsTable: function () { // proxy method to check if the current clone of the source table is the one that contains both the scrollable rows and the scrollable columns (bottom-right clone)
                    var me = $(this);
                    bresult = false;
                    if (me.is('table')) {
                        return (me.attr(attr.id) == id.table + id.suffix.cells);
                    }

                    return bresult;
                },
                getNbRows: function () { // retrieve the number of rows from the structure of the source table
                    var me = $(this);
                    var iresult = 0;
                    if (me.is('table')) {
                        iresult = me.find('tr').length;
                    }

                    return iresult;
                },
                getNbCols: function () { // retrieve the real number of columns from the structure of the source table
                    var me = jQuery(this);
                    var iresult = 0;
                    if (me.is('table')) {
                        var $tds = me.find('tr:first').find('th, td'); // we calcultate the number of columns based on the first row

                        $tds.each(function () {
                            var $this = jQuery(this);
                            var ispan = 1; // by default, a column has a colspan of 1

                            if ($this.hasAttr(attr.colspan)) { // to calculate the real number of columns, we take into account the colspan attributes
                                if (typeof $this.attr(attr.colspan) != typeof undefined) {
                                    ispan = parseInt($this.attr(attr.colspan));
                                }
                            }

                            iresult += ispan; // we add colspan number to the result
                        });
                    }

                    return iresult;
                },
                isAdaptableVisible: function () { // check if an element inside a clone of the source table is visible or not
                    var me = $(this);
                    var $table = me.closest('table');
                    //  __________________________________________________
                    // |                   ||                             |
                    // |       top-        ||           top-              |
                    // |    left clone     ||       right clone           |
                    // |  (frozen rows &   ||     (frozen rows &          |
                    // |   frozen cols)    ||      scrollable cols)       |
                    // |___________________||_____________________________|
                    // |      bottom-      ||* left   bottom-             |
                    // |    left clone     ||top    right clone           |
                    // |(scrollable rows & ||     (scrollable rows &      |
                    // |   frozen cols)    ||      scrollable cols)       |
                    // |___________________||_____________________________|
                    //

                    // in case the element is in the top-left clone:
                    // if the top position of the element of the top-left clone is lower than the one from the bottom-right clone,
                    // and the left position of the element of the top-left clone is lower than the one from the bottom-right clone, the element is visible
                    if ($table.isFixedRootTable()) {
                        return ((me.offset().top + 1) < elem.tableCellsDiv().offset().top && (me.offset().left + 1) < elem.tableCellsDiv().offset().left);
                    }

                    // in case the element is in the top-right clone:
                    // if the top position of the element of the top-right clone is lower than the one from the bottom-right clone,
                    // and the left position of the element of the top-rigth clone is higher or equal to the one from the bottom-right clone, the element is visible
                    if ($table.isFixedHeadersTable()) {
                        return ((me.offset().top + 1) < elem.tableCellsDiv().offset().top && (me.offset().left + 1) >= elem.tableCellsDiv().offset().left);
                    }

                    // in case the element is in the bottom-left clone:
                    // if the top position of the element of the bottom-left clone is higher or equal to the one from the bottom-right clone,
                    // and the left position of the element of the bottom-left clone is lower than the one from the bottom-right clone, the element is visible
                    if ($table.isFixedColsTable()) {
                        return ((me.offset().top + 1) >= elem.tableCellsDiv(0).offset().top && (me.offset().left + 1) < elem.tableCellsDiv().offset().left);
                    }

                    // in case the element is in the bottom-right clone:
                    // if the top position of the element of the bottom-right clone is higher or equal to the one from the bottom-right clone,
                    // and the left position of the element of the bottom-right clone is higher or equal to the one from the bottom-right clone, the element is visible
                    if ($table.isCellsTable()) {
                        return ((me.offset().top + 1) >= elem.tableCellsDiv().offset().top && (me.offset().left + 1) >= elem.tableCellsDiv().offset().left);
                    }

                    return true;
                },
                cleanHiddenInputsId: function () { // method used to remove id and name attributes for the hidden inputs of the clone table, in order not to submit them
                    var me = $(this);
                    var $tables = me.find('table');
                    // explanation: the clone system is efficient if we keep all the element of the source table in its clones, in order not to calculate the dimensions of the rows or the columns of the clones
                    // the problem is: when we submit a form that contains the source table, all the non-empty inputs of the clones will be submitted, even those that are hidden.
                    // To avoid it, we remove the id and name attributes from the hidden inputs located in the clones

                    $tables.each(function () {
                        var me = $(this);
                        if (me.find('input, textarea, select').length > 0) { // for max perfs, we bypass the removing process if there is no input in the clones of the source table
                            var $tds = me.find('th, td');
                            var $hiddenTds = [];
                            //  retrieval of hidden cells
                            $tds.each(function () {
                                if (!$(this).isAdaptableVisible()) {
                                    $hiddenTds.push($(this));
                                }
                            });
                            $hiddenTds = $([]).pushStack($hiddenTds);
                            if ($hiddenTds.length > 0) { // for each input located in an hidden cell, we remove the id and the name attributes, so it cannot be submitted
                                $hiddenTds.find('input, textarea, select').removeAttr(attr.id).removeAttr(attr.name);
                            }
                        }
                    });
                },
                __saveDimensions: function (elt) {
                    var me = elt;
                    var $body = elem.body();
                    var $outer = me.clone();
                    // addition of a faked empty div element that rerieves all the css classes and the inline styles of the current element, in order to calculate its computed dimensions
                    // we have to work with a faked empty div, because the current element can be overflowed by the resulting tables
                    $outer.attr('id', me.attr('id')).attr('class', me.attr('class')).attr('style', me.attr('style')).css({visibility: 'hidden', overflow: 'hidden'}).appendTo($body);
                    methods.__addCssFromOuter(me, $outer, css.marginLeft);
                    methods.__addCssFromOuter(me, $outer, css.marginTop);
                    methods.__addCssFromOuter(me, $outer, css.marginRight);
                    methods.__addCssFromOuter(me, $outer, css.marginBottom);
                    methods.__addCssFromOuter(me, $outer, css.paddingLeft);
                    methods.__addCssFromOuter(me, $outer, css.paddingTop);
                    methods.__addCssFromOuter(me, $outer, css.paddingRight);
                    methods.__addCssFromOuter(me, $outer, css.paddingBottom);
                    $outer.remove(); // removing of the faked div
                },
                __addCssFromOuter: function (elt, outer, cssStyle) { // addition of an inline style according to an associated faked div element
                    var val = 0;
                    if (parseInt(outer.css(cssStyle)) > 0) {
                        val = parseInt(outer.css(cssStyle));
                        elt.css(cssStyle, val);
                    }
                },
                __manageFixedRowClasses: function (me) { // management of the fixed classes for the frozen rows (private method)
                    if (settings.useFixedClasses.rows == false) { // if the frozen rows are not deducted from the html code, we need to add dynamically the fixed classes for the frozen rows
                        me.find('tr.' + cl.fixed).removeClass(cl.fixed);
                        for (var i = 0; i < settings.nbFixedRows; i++) {
                            me.find('tr:nth(' + i + ')').addClass(cl.fixed);
                        }
                    }
                }
            };
            var rPos = 'relative';
            var lFloat = 'left';
            var vOverflow = 'visible';
            var hOverflow = 'hidden';
            var aOverflow = 'auto';
            var divTag = '<div />';
            var fixedRowHeadersHeight = 0;
            var fixedColsWidth = 0;
            var nbCols = 0;
            $.fn.extend({
                isFixedRootTable: methods.isFixedRootTable,
                isFixedColsTable: methods.isFixedColsTable,
                isFixedHeadersTable: methods.isFixedHeadersTable,
                isCellsTable: methods.isCellsTable,
                getNbRows: methods.getNbRows,
                getNbTheadRows: methods.getNbTheadRows,
                getNbTbodyRows: methods.getNbTbodyRows,
                getNbCols: methods.getNbCols,
                isAdaptableVisible: methods.isAdaptableVisible,
                addMissingColumns: methods.addMissingColumns,
                cleanHiddenInputsId: methods.cleanHiddenInputsId,
                saveParentsDimensions: methods.saveParentsDimensions,
                adjustDims: methods.adjustDims
            });
            ieVersion = detectIE();
            elem.wrapper().css(css.visibility, 'visible');
            // do it for every element that matches selector
            this.each(function () {
                var me = $(this);
                var parents = [];
                me.parents().each(function () {
                    parents.push($(this));
                });
                parents.reverse();
                var tableWidth = 0;
                me.css('table-layout', 'fixed');
                fixedRowHeadersHeight = 0;
                fixedColsWidth = 0;
                methods.__manageFixedRowClasses(me);
                me.addMissingColumns();
                me.css(css.width, tableWidth);
                var fixedRowHeaders = me.find('tr.' + cl.fixed);
                var fixedCols = me.find('col.' + cl.fixed);
                var newTableDiv = $(divTag)
                    .attr(attr.id, id.table + id.suffix.wrapper)
                    .addClass(cl.sheet)
                    .css(css.position, rPos);
                me.after(newTableDiv);
                if (fixedRowHeaders.length >= 0) {
                    var newTableHeadersDiv = $(divTag)
                        .attr(attr.id, id.table + id.suffix.headers)
                        .css(css.position, rPos);
                    var newTableFixedRootDiv = $(divTag)
                        .attr(attr.id, id.table + id.suffix.fixedRoot)
                        .css(css.overflow, hOverflow)
                        .css(css.floatPos, lFloat);
                    var newTableFixedRootWrapper = $(divTag)
                        .attr(attr.id, id.table + id.suffix.fixedRoot + id.suffix.wrapper)
                        .css(css.overflow, vOverflow).css(css.zIndex, 20);
                    var newTableFixedHeadersDiv = $(divTag)
                        .attr(attr.id, id.table + id.suffix.fixedHeaders)
                        .css(css.overflow, hOverflow);
                    var newTableFixedHeadersWrapper = $(divTag)
                        .attr(attr.id, id.table + id.suffix.fixedHeaders + id.suffix.wrapper)
                        .css(css.overflow, vOverflow)
                        .css(css.zIndex, 20);
                }
                var newTableRowsDiv = $(divTag)
                    .attr(attr.id, id.table + id.suffix.rows);
                var newTableFixedColsDiv = $(divTag)
                    .attr(attr.id, id.table + id.suffix.fixedCols)
                    .css(css.overflow, hOverflow)
                    .css(css.floatPos, lFloat)
                    .css(css.position, rPos);
                var newTableFixedColsWrapper = $(divTag)
                    .attr(attr.id, id.table + id.suffix.fixedCols + id.suffix.wrapper)
                    .css(css.overflow, vOverflow)
                    .css(css.floatPos, lFloat)
                    .css(css.zIndex, 20);
                var newTableFixedColsScrollFixDiv = $(divTag)
                    .attr(attr.id, id.table + id.suffix.fixedCols + id.suffix.scrollFix)
                    .css(css.lineHeight, '25px')
                    .html(str.space);
                if (fixedRowHeaders.length >= 0) {
                    var newTableCellsDiv = $(divTag)
                        .attr(attr.id, id.table + id.suffix.cells)
                        .css(css.overflow, aOverflow)
                        .addClass(cl.scrollable);
                    var newTableCellsWrapper = $(divTag)
                        .attr(attr.id, id.table + id.suffix.cells + id.suffix.wrapper)
                        .css(css.overflow, vOverflow);
                    me.find('col').each(function () {
                        tableWidth += parseInt($(this).attr(attr.width), 10);
                    });
                    me.css(css.width, tableWidth);
                    fixedCols.each(function () {
                        fixedColsWidth += parseInt($(this).attr(attr.width), 10);
                    });
                    if ($(this).css(css.marginLeft)) {
                        fixedColsWidth += parseInt($(this).css(css.marginLeft), 10) + 1;
                    }
                    fixedRowHeaders.each(function () {
                        fixedRowHeadersHeight += $(this).get(0).clientHeight;
                    });
                    if ($(this).css(css.marginTop)) {
                        fixedRowHeadersHeight += parseInt($(this).css(css.marginTop), 10) + 1;
                    }

                    var tableCode = me.detach();
                    me.saveParentsDimensions(parents);
                    var rootTable = tableCode
                        .clone()
                        .attr(attr.id, id.table + id.suffix.fixedRoot);
                    var headersTable = tableCode
                        .clone()
                        .attr(attr.id, id.table + id.suffix.fixedHeaders);
                    var fixedColsTable = tableCode
                        .clone()
                        .attr(attr.id, id.table + id.suffix.fixedCols);
                    var cellsTable = tableCode
                        .attr(attr.id, id.table + id.suffix.cells);
                    rootTable.find('tr:not(.' + cl.fixed + ')').remove();
                    headersTable.find('tr:not(.' + cl.fixed + ')').remove();
                    newTableFixedRootWrapper.empty().html(rootTable);
                    newTableFixedHeadersWrapper.empty().html(headersTable);
                    newTableFixedColsWrapper.empty().html(fixedColsTable);
                    newTableCellsWrapper.empty().html(cellsTable);
                    newTableDiv.append(newTableHeadersDiv);
                    newTableHeadersDiv.append(newTableFixedRootDiv);
                    newTableFixedRootDiv.append(newTableFixedRootWrapper);
                    newTableHeadersDiv.append(newTableFixedHeadersDiv);
                    newTableFixedHeadersDiv.append(newTableFixedHeadersWrapper);
                    newTableDiv.append(newTableRowsDiv);
                    newTableRowsDiv.append(newTableFixedColsDiv);
                    newTableFixedColsDiv.append(newTableFixedColsWrapper);
                    newTableFixedColsDiv.append(newTableFixedColsScrollFixDiv);
                    newTableRowsDiv.append(newTableCellsDiv);
                    newTableCellsDiv.append(newTableCellsWrapper);
                    newTableFixedRootDiv.css(css.height, fixedRowHeadersHeight);
                    newTableFixedRootDiv.css(css.width, fixedColsWidth);
                    newTableFixedHeadersDiv.css(css.height, fixedRowHeadersHeight);
                    if (fixedColsWidth > newTableRowsDiv.width()) {
                        // adding the vertical scrolling bar
                        newTableFixedColsDiv
                            .css(css.width, (newTableRowsDiv.width() - $.fn.getScrollBarHeight()));
                    } else {
                        newTableFixedColsDiv
                            .css(css.width, fixedColsWidth);
                    }
                    newTableCellsWrapper
                        .css(css.marginTop, '-' + (fixedRowHeadersHeight) + 'px');
                    newTableFixedColsWrapper
                        .css(css.marginTop, '-' + (fixedRowHeadersHeight) + 'px');
                    newTableCellsWrapper
                        .css(css.marginLeft, '-' + (fixedColsWidth) + 'px');
                    newTableFixedHeadersWrapper
                        .css(css.marginLeft, '-' + (fixedColsWidth) + 'px');
                    methods.adjustDims();
                    if (newTableCellsDiv.hasScrollBar().vertical) {
                        var $lastTds = newTableFixedHeadersWrapper.find('tr').find(':nth-last-child(1)');
                        $lastTds.each(function () {
                            $(this).closest('tr').append($(this).clone().css(css.visibility, 'hidden').css(css.border, 'none').addClass(cl.adaptableTableHidden));
                        });
                    }

                    newTableCellsDiv.bind(evt.scroll, evt.syncTablePanels);
                    newTableFixedColsDiv.bind(evt.scroll, evt.syncTablePanels);
                    newTableFixedHeadersDiv.bind(evt.scroll, evt.syncTablePanels);
                    // clean all ids and names from hidden inputs in order not to interfere with form submission
                    newTableDiv.cleanHiddenInputsId();
                    // elem.wrapper().detach();
                    $.fn.find = function (selector) {
                        var i, ret,
                            len = this.length,
                            self = this;
                        if (typeof selector !== "string") {
                            return this.pushStack($(selector).filter(function () {
                                for (i = 0; i < len; i++) {
                                    if ($.contains(self[i], this)) {
                                        return true;
                                    }
                                }
                            }));
                        }

                        ret = this.pushStack([]);
                        for (i = 0; i < len; i++) {
                            $.find(selector, self[i], ret);
                        }

                        var rlen = ret.length;
                        for (i = 0; i < rlen; i++) {
                            var $this = $(ret[i]);
                            if (!!($this.is('th') || $this.is('td'))) {
                                if (!$this.isAdaptableVisible() || !!$this.hasClass(cl.adaptableTableHidden)) {
                                    ret.splice(i, 1);
                                    i--;
                                }
                            }
                        }

                        return len > 1 ? $.unique(ret) : ret;
                    };
                    $.expr.pseudos.visible = function (elt) {
                        var $this = $(elt);
                        if (!!($this.is('th') || $this.is('td'))) {
                            return !!($this.isAdaptableVisible() && !$this.hasClass(cl.adaptableTableHidden) && (elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length));
                        }

                        return !!(elem.offsetWidth || elem.offsetHeight);
                    };
                }
                else {
                    newTableDiv.append(me);
                    methods.adjustDims();
                }
            });
            if (!!settings.adaptableSize) {
                $(window).bind(evt.resize, function () {
                    methods.adjustDims();
                });
            }

            // maintain chainability
            return this;
        }
    });
    $.fn.extend({
        hasScrollBar: $.fn.hasScrollBar,
        inlineStyle: $.fn.inlineStyle,
        hasAttr: $.fn.hasAttr,
        isFixedRootTable: $.fn.isFixedRootTable,
        adaptable: $.fn.adaptable
    });
})(jQuery);
