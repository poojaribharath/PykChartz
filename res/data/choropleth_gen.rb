puts '{'

50.times do |i|
  puts ' "' + i.to_s + '":'

  puts "  {"

  # deaths
  puts '   "deaths":'
  puts "   {"
  puts '    "color": "red"'
  puts '    "tooltip": "wat"'
  d = (rand() * 100).floor
  puts '    "data": ' + d.to_s
  puts '    "display_name": "kermit"'
  puts "   }"


  # population
  puts '   "population":'
  puts "   {"
  puts '    "color": "blue"'
  puts '    "tooltip": "wat"'
  d = (rand() * 100).floor
  puts '    "data": ' + d.to_s
  puts '    "display_name": "kermit"'
  puts "   }"

  # parties
  puts '   "parties":'
  puts "   {"
  puts '    "color": "green"'
  puts '    "tooltip": "wat"'
  d = (rand() * 100).floor
  puts '    "data": ' + d.to_s
  puts '    "display_name": "kermit"'
  puts "   }"


  puts "  }"
end

puts '}'
