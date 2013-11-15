top_cat = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
under_cat = ["Previous", "Current", "Next", "Predicted"]
data_cat = ["Missed", "Achieved", "Over Achieved", "Potato"]
colors = ["#1E76B4", "#FF7F0D", "#2CA02C", "#D62728"]
tooltips = [
            "The light of a hundred stars does not equal the light of the moon.",
            "Don't look now, but there is a multi-legged creature on your shoulder.",
            "today: A nice place to visit, but you can't stay here for long.",
            "Have at you!",
            "Needs are a function of what other people have."
           ]

data = []

top_cat.each do |tc|
  t_data = []

  under_cat.each do |uc|
    if((rand * under_cat.length) > 1)
      uc_data = []

      data_cat.each_with_index do |dc,i|
          dc_data = {
            "name" => dc,
            "val" => (rand * 100).floor,
            "color" => colors[i],
            "tooltip" => tooltips[(rand * 5).floor]
          }
          uc_data.push(dc_data)

      end

      t_data.push({uc => uc_data})
    end
  end

  data.push({tc => t_data})
end


puts data.to_s.gsub("=>", ":")
