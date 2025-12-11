import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface FormRequest {
  name?: string
  email?: string
  phone?: string
  program?: string
  year?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: FormRequest = await request.json()

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Create or find user
    let user = await db.user.findUnique({
      where: { email: body.email }
    })

    if (!user) {
      user = await db.user.create({
        data: {
          email: body.email,
          name: body.name,
          phone: body.phone,
          program: body.program,
          year: body.year
        }
      })
    } else {
      // Update existing user with new information
      user = await db.user.update({
        where: { id: user.id },
        data: {
          name: body.name || user.name,
          phone: body.phone || user.phone,
          program: body.program || user.program,
          year: body.year || user.year
        }
      })
    }

    // Create form submission
    const formSubmission = await db.formSubmission.create({
      data: {
        userId: user.id,
        type: 'contact',
        data: JSON.stringify(body),
        status: 'pending'
      }
    })

    return NextResponse.json({
      success: true,
      submissionId: formSubmission.id,
      message: 'Form submitted successfully'
    })

  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const submissions = await db.formSubmission.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      submissions: submissions.map(sub => ({
        id: sub.id,
        type: sub.type,
        status: sub.status,
        data: JSON.parse(sub.data),
        user: sub.user,
        createdAt: sub.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching form submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}