puts '{'

n = 100000

n.times do |i|
  puts ' "' + i.to_s + '":'

  puts "  {"

  # deaths
  puts '   "deaths":'
  puts "   {"
  puts '    "color": "red",'
  puts '    "tooltip": "wat",'
  d = (rand() * 90).floor + 10
  puts '    "data": ' + d.to_s + ','
  puts '    "display_name": "kermit"'
  puts "   },"


  # population
  puts '   "population":'
  puts "   {"
  puts '    "color": "blue",'
  puts '    "tooltip": "wat",'
  d = (rand() * 90).floor + 10
  puts '    "data": ' + d.to_s + ','
  puts '    "display_name": "kermit"'
  puts "   },"

  # parties
  puts '   "parties":'
  puts "   {"
  puts '    "color": "green",'
  puts '    "tooltip": "wat",'
  d = (rand() * 90).floor + 10
  puts '    "data": ' + d.to_s + ','
  puts '    "display_name": "kermit"'
  puts "   }"

  comma = (i+1 == n) ? "" : ","

  puts "  }" + comma
end

puts '}'
