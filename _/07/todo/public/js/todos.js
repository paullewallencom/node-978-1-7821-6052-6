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

  function hideOrShowDateTime() {
    var ringAlarm = $('input[name=alarm]:checked',
      '#new-todo-form').val() === 'true';

    if (ringAlarm) {
      $('#alarm-date-time').slideDown();
    } else {
      $('#alarm-date-time').slideUp();
    }
  }

  $('#new-todo-form input[name=alarm]').change(hideOrShowDateTime);
  hideOrShowDateTime();

});