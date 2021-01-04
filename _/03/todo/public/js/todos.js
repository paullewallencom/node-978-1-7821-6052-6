$(function() {
  $('#todo-list').sortable({
    update: function() {
      var order = [];
      $('.todo').each(function(idx, row) {
        order.push($(row).find('.pos').text());
      });
      
      $.post('/todos/sort', {order: order.join(',')}, function() {
        $('.todo').each(function(idx, row) {
          $(row).find('.pos').text(idx + 1);
        });
      });

    }
  });
});