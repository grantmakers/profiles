module Jekyll

  module Humanize
    ##
    # This is a port of the Django app `humanize` which adds a "human touch"
    # to data. Given that Jekyll produces static sites, some of the original
    # methods do not make logical sense (e.g. naturaltime).
    #
    # Source code can be viewed here:
    # https://github.com/django/django
    #
    # Copyright (c) Django Software Foundation and individual contributors.
    # All rights reserved.

    ####################
    #  PUBLIC METHODS  #
    ####################

    def ordinal(value, flag=nil)
      ##
      # Converts an integer to its ordinal as a string. 1 is '1st', 2 is '2nd',
      # 3 is '3rd', etc. Works for any integer.
      #
      # Usage:
      # {{ somenum }} >>> 3
      # {{ somenum | ordinal }} >>> '3rd'
      # {{ somenum | ordinal: "super" }} >>> '3<sup>rd</sup>'

      begin
        value = value.to_i
        flag.to_s.downcase!
      rescue Exception => e
        puts "#{e.class} #{e}"
        return value
      end

      suffix = ""
      suffixes = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"]
      unless [11, 12, 13].include? value % 100 then
        suffix = suffixes[value % 10]
      else
        suffix = suffixes[0]
      end

      unless flag and flag == "super"
        return "#{value}%s" % suffix
      else
        return "#{value}<sup>%s</sup>" % suffix
      end

    end

    def intcomma(value, delimiter=",")
      ##
      # Converts an integer to a string containing commas every three digits.
      # For example, 3000 becomes '3,000' and 45000 becomes '45,000'.
      # Optionally supports a delimiter override for commas.
      #
      # Usage:
      # {{ post.content | number_of_words }} >>> 12345
      # {{ post.content | number_of_words | intcomma }} >>> '12,345'
      # {{ post.content | number_of_words | intcomma: '.' }} >>> '12.345'

      begin
        orig = value.to_s
        delimiter = delimiter.to_s
      rescue Exception => e
        puts "#{e.class} #{e}"
        return value
      end

      copy = orig.strip
      copy = orig.gsub(/^(-?\d+)(\d{3})/, "\\1#{delimiter}\\2")
      orig == copy ? copy : intcomma(copy, delimiter)
    end

    def inthuman(value)
      begin
        value = value.to_i
      rescue Exception => e
        puts "#{e.class} #{e}"
        return value
      end

      if value < 1000
        return value
      end

      # return number_to_human(value,format:'%n%u',units:{thousand:'K',million:'M',billion:'B'})

    end

    def intword(value)
      ##
      # Converts a large integer to a friendly text representation. For example
      # 1000000 becomes '1.0M', 1200000 becomes '1.2M', etc.
      #
      # Usage:
      # {{ largenum }} >>> 1200000
      # {{ largenum | intword }} >>> '1.2 million'

      begin
        value = value.to_i
      rescue Exception => e
        puts "#{e.class} #{e}"
        return value
      end

      if value < 1000.0
        return value
      end

      if value >= 1000.0 && value < 1000000.0
        abbr = 'K'
        value = value / 1000.0
      end

      if value >= 1000000.0 && value < 1000000000.0
        abbr = 'M'
        value = value / 1000000.0
      end

      if value >= 1000000000.0
        abbr = 'B'
        value = value / 1000000000.0
        # I look forward to this biting me in the ass - a foundation with over $1 trillion in assets
      end

      # Use # Kernel#sprintf to narrow to 1 decimal or less
      digits = "%.1f" % value
      digits = digits.to_s.length
      case
      # Only show a decimal if number is single thousands, single millions, or single billions (e.g. 1000 => 1.0k)
      when digits == 3
        value = "%.1f" % value
      else 
        value = "%.0f" % value
      end
      return "#{value}#{abbr}"
    end

    def apnumber(value)
      ##
      # For numbers 0-9, returns the number spelled out. Otherwise, returns the
      # number. This follows Associated Press style.
      #
      # Usage:
      # {{ num }} >>> 6
      # {{ num | apnumber }} >>> six

      begin
        value = value.to_i
      rescue Exception => e
        puts "#{e.class} #{e}"
        return value
      end

      unless value >= 0 and value < 10 then
        return value
      else
        return ["zero", "one", "two", "three", "four", "five", "six",
          "seven", "eight", "nine"][value]
      end

    end

    def naturalday(date)
      ##
      # For date values that are within a 9 day stretch from present day, this
      # will attempt to return the string representation in the format of today,
      # tomorrow, yesterday, "in # days" or "# days ago". Otherwise, returns a
      # string formatted according to the "date_format" setting in your
      # _config.yml file using strftime format (if not defined, it will default
      # to "%m/%d/%Y").
      #
      # Usage:
      # TODAY == 01/26/2014
      # {{ post.updated }} >>> 01/25/2014
      # {{ post.updated | naturalday }} >>> 'yesterday'
      # {{ post.date }} >>> 01/19/2014
      # {{ post.date | naturalday }} >>> 'seven days ago'

      begin
        site = @context.registers[:site]
        date_format = site.config['humanize']['date_format']
        date = time(date).to_date
      rescue Exception => e
        puts "#{e.class} #{e}"
        return date
      end

      unless date_format then
        date_format = "%m/%d/%Y"
      end

      today = time(Time.now).to_date
      delta = (date - today).to_i

      case delta
      when 0
        return "today"
      when 1
        return "tomorrow"
      when 2..9
        delta = apnumber(delta)
        return "in #{delta} days"
      when -1
        return "yesterday"
      when -9..-2
        delta = apnumber(delta * -1)
        return "#{delta} days ago"
      else
        return date.strftime("#{date_format}")
      end

    end

    def filesize(value)
      ##
      # For filesize values in bytes, returns the number rounded to 3
      # decimal places with the correct suffix.
      #
      # Usage:
      # {{ bytes }} >>> 123456789
      # {{ bytes | filesize }} >>> 117.738 MB
      filesize_tb = 1099511627776.0
      filesize_gb = 1073741824.0
      filesize_mb = 1048576.0
      filesize_kb = 1024.0

      begin
        value = value.to_f
      rescue Exception => e
        puts "#{e.class} #{e}"
        return value
      end

      if value >= filesize_tb
        return "%s TB" % (value / filesize_tb).to_f.round(3)
      elsif value >= filesize_gb
        return "%s GB" % (value / filesize_gb).to_f.round(3)
      elsif value >= filesize_mb
        return "%s MB" % (value / filesize_mb).to_f.round(3)
      elsif value >= filesize_kb
        return "%s KB" % (value / filesize_kb).to_f.round(0)
      elsif value == 1
        return "1 byte"
      else
        return "%s bytes" % value.to_f.round(0)
      end

    end

    #####################
    #  PRIVATE METHODS  #
    #####################

    private
    def time(input)
      case input
      when Time
        input
      when String
        Time.parse(input)
      else
        Jekyll.logger.error "Invalid Date:", "'#{input}' not valid datetime."
        exit(1)
      end
    end

  end

end

Liquid::Template.register_filter(Jekyll::Humanize)